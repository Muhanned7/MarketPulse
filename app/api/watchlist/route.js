import pool from '@/lib/db'
import { index } from '@/lib/pinecone'
import { getEmbedding } from '@/lib/embeddings'


export async function GET(){
    const tickers = await pool.query(`
        SELECT * from watchlist`)
    //console.log("tickers", tickers)
    return Response.json({ tickers: tickers.rows })
}


export async function POST(request) {
    const { symbol } = await request.json()

    if (!symbol){
        return Response.json({ erro: 'Symbol is required'}, {status:400})
    }

    try{
        
        
        await pool.query(
            `INSERT INTO watchlist (ticker)
            VALUES ($1)`,
            [symbol.toUpperCase() ]
        )

               
        

        return Response.json({
            message: 'Ticker added to watch list successfully',
            ticker: {
                symbol: symbol
            }
        })
    } catch(err){
    return Response.json({ error: 'Symbol is required' }, { status: 500 })
    }
}



export async function DELETE(request) {
    const { symbol } =await request.json()

    if (!symbol){
        return Response.json({ erro: 'Symbol is required'}, {status:400})
    }
    
    try{
    await pool.query(`DELETE FROM watchlist WHERE ticker= $1`,[symbol.toUpperCase()])
        return Response.json(
            {message: "The ticker was deleted succesfully."}, {status: 200}
        )
}
catch(err){
    return Response.json({ error: 'Could not be deleted' }, { status: 500 })
}

    
}