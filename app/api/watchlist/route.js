import pool from '@/lib/db'
import { index } from '@/lib/pinecone'
import { getEmbedding } from '@/lib/embeddings'
import jwt from 'jsonwebtoken'

export async function GET(request){
    const auth = request.headers.get('authorization')
    if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    
    const token = auth.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user_id = decoded.sub
    const tickers = await pool.query(`
        SELECT * from watchlist WHERE user_id=($1)`, [user_id])
    //console.log("tickers", tickers)
    return Response.json({ tickers: tickers.rows })
}


export async function POST(request) {
    const auth = request.headers.get('authorization')
    if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    
    const token = auth.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user_id = decoded.sub

    console.log("user id: ",user_id)
    const { symbol } = await request.json()
    if (!symbol){
        return Response.json({ error: 'Symbol is required'}, {status:400})
    }

    try{
        
        
        await pool.query(
            `INSERT INTO watchlist (ticker, user_id)
            VALUES ($1, $2)`,
            [symbol.toUpperCase(),  user_id]
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