import './env.js'

import pool from '../lib/db.js';
import { index } from '../lib/pinecone.js';
import { getEmbedding } from '../lib/embeddings.js';


async function seedTop100(){
try {
    const top100 = [
        "NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "GOOG", "META", "AVGO", "TSLA", 
        "BRK.B", "LLY", "WMT", "JPM", "V", "XOM", "UNH", "MA", "PG", "JNJ", 
        "HD", "MRK", "COST", "ABBV", "NFLX", "AMD", "CRM", "TMUS", "CVX", 
        "BAC", "KO", "PEP", "LIN", "ADBE", "MCD", "CSCO", "ACN", "ABT", 
        "DIS", "TMO", "WFC", "INTU", "PM", "VZ", "AMGN", "IBM", "NOW", 
        "SPGI", "RTX", "GS", "CAT", "UNP", "PFE", "BKNG", "NEE", "MS", 
        "HON", "ETN", "ELV", "SYK", "SCHW", "ISRG", "UBER", "LMT", "COP", 
        "T", "MU", "VRTX", "LOW", "PLTR", "QCOM", "RTX", "ADI", "PANW", 
        "REGN", "KLAC", "ADP", "MDT", "FI", "BA", "DE", "BLK", "AMT", 
        "SBUX", "GILD", "GE", "TJX", "CME", "SNPS", "ZTS", "MO", "ICE", 
        "SO", "CMG", "WM", "EMR", "ITW", "GD", "CL", "DUK", "BDX"
    ];

    console.log(`Seeding Top ${top100.length} most important tickers`);

    let toProcess = top100;

    // Filter out already existing ones
    const existing = await pool.query('SELECT symbol FROM tickers WHERE name IS NOT NULL AND description IS NOT NULL AND sector IS NOT NULL');
    const existingSet = new Set(existing.rows.map(r => r.symbol));
    
    toProcess = toProcess.filter(t => !existingSet.has(t));
    console.log(`New tickers to add: ${toProcess.length}`);
    
    let successCount = 0;
    let skipped = 0;
    let rateLimited = 0;

    for (const ticker of toProcess) {
        try {
            const res = await fetch(
                `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${process.env.FINNHUB_API}`
            );
            
            const company = await res.json();
            console.log(company)
            // Better debugging
            console.log(`🔍 ${ticker} →`, 
                company.name ? `✅ ${company.name}` : 
                company.error ? `❌ Error: ${company.error}` : '⭕ Empty response'
            );

            // Accept if we have at least a name
            if (!company || !company.name) {
                skipped++;
                continue;
            }
            
            await pool.query(
                `INSERT INTO tickers (symbol, name, description, sector, industry)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (symbol) DO UPDATE SET
                 name = EXCLUDED.name,
                 sector = EXCLUDED.sector,
                 industry = EXCLUDED.industry`,
                [
                  company.ticker || ticker,
                  company.name,
                  null,                          // Finnhub has no description
                  company.finnhubIndustry || null,  // use as sector
                  company.finnhubIndustry || null   // same value for industry
                ]
            )

            const textToEmbed = `${company.name} ${company.sector || ''} ${company.finnhubIndustry || ''} ${company.description || ''}`.trim();

            if (textToEmbed.length > 30) {
                const embedding = await getEmbedding(textToEmbed);

                await index.namespace('tickers').upsert({
                    records: [{
                        id: company.ticker || ticker.symbol,
                        values: Array.from(embedding),
                        metadata: {
                            symbol: company.ticker || ticker.symbol,
                            name: company.name,
                            sector: company.finnhubIndustry || null,  // use as sector
                            industry: company.finnhubIndustry || null   // same value for industry
                        }
                    }]
                });

                await pool.query('UPDATE tickers SET embedding_stored = TRUE WHERE symbol = $1', 
                    [company.ticker || ticker]
                );
            }

            successCount++;
            console.log(`✅ Added: ${ticker} - ${company.name}`);

        } catch (err) {
            console.error(`❌ Error on ${ticker}:`, err.message);
            skipped++;
        }

        await new Promise(r => setTimeout(r, 1500));  // 1.2 seconds (safe for free tier)
    }

    console.log({
        message: "Seeding completed",
        alreadyInDB: existing.rows.length,
        newProcessed: toProcess.length,
        success: successCount,
        skipped: skipped,
        rateLimited
    });

} catch (err) {
    console.error(err);
}
}


seedTop100()