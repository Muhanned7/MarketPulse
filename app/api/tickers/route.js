import pool from '@/lib/db'
import { index } from '@/lib/pinecone'
import { getEmbedding } from '@/lib/embeddings'


export async function GET(){
    const result =await pool.query('SELECT * FROM tickers ORDER BY created_at DESC')
    return Response.json({ tickers: result.rows })
}

export async function POST(request) {
    try {
        
        const { ticker } = await request.json()
        // Filter out already existing ones
        const existing = await pool.query('SELECT symbol FROM tickers');
        const existingSet = new Set(existing.rows.map(r => r.symbol));
        
      
        if (!existingSet.has(symbol)){
               
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
                }

                await pool.query(
                    `INSERT INTO tickers (symbol, name, description, sector, industry)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (symbol) DO NOTHING`,
                    [
                        company.ticker || ticker,
                        company.name,
                        company.description || null,
                        company.sector || null,
                        company.industry || company.finnhubIndustry || null
                    ]
                );

                const textToEmbed = `${company.name} ${company.sector || ''} ${company.industry || ''} ${company.description || ''}`.trim();

                if (textToEmbed.length > 30) {
                    const embedding = await getEmbedding(textToEmbed);

                    await index.namespace('tickers').upsert({
                        records: [{
                            id: company.ticker || ticker.symbol,
                            values: Array.from(embedding),
                            metadata: {
                                symbol: company.ticker || ticker.symbol,
                                name: company.name,
                                sector: company.sector,
                                industry: company.industry || company.finnhubIndustry
                            }
                        }]
                    });

                    await pool.query('UPDATE tickers SET embedding_stored = TRUE WHERE symbol = $1', 
                        [company.ticker || ticker.symbol]
                    );
                }

                console.log(`✅ Added: ${ticker.symbol} - ${company.name}`);

            } catch (err) {
                console.error(`❌ Error on ${ticker.symbol}:`, err.message);
            }

        return Response.json({
            message: "Saved to DB",
            alreadyInDB: `Alredy in DB ${ticker}`,
            newProcessed: ticker,
            
        });
    }
    } catch (err) {
        console.error(err);
        return Response.json({ error: err.message }, { status: 500 });
    }
        
}
