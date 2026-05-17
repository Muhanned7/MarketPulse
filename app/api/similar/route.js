import {getEmbedding} from '@/lib/embeddings.js'
import {index} from '@/lib/pinecone'



export async function POST(request){
    const { query, save } = await request.json()

    const embeddingArray = await getEmbedding(query)

    const results = await index.query({
        vector: embeddingArray,
        topK: 2,
        includeMetadata: true
    }
    )
    return Response.json({results})
}