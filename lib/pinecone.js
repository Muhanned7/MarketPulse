import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
})

export const index = pinecone.index('marketpulse')

export default pinecone