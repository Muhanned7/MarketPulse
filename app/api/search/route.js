import Anthropic from '@anthropic-ai/sdk'
import { tagSectors } from '@/lib/sectorTagger'

import pool from '@/lib/db'
import { index } from '@/lib/pinecone'
import { getEmbedding } from '@/lib/embeddings'


export const maxDuration = 60 // seconds

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

function mockScore(article) {
  return {
    score: Math.floor(Math.random() * 10) + 1,
    sentiment: ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)],
    confidence: parseFloat((Math.random()).toFixed(2)),
    rationale: 'Mock rationale for development purposes.'
  }
}

const cache = new Map()

export async function POST(request) {
  const { query, save } = await request.json()

  if (!query) {
    return Response.json({ error: 'Query is required' }, { status: 400 })
  }
  function hashStr(str) {
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0
    }
    return Math.abs(h).toString(16)
  }
  if (cache.has(query)) {
    return Response.json({articles: cache.get(query), cached:true})
  }
  /*
  const response = await client.messages.create({
    model : "claude-sonnet-4-20250514",
    max_tokens : 1000,
    system :  `You are a financial news aggregator for the query ${query}, Search for the 6 most recent and relevant news headlines for the given query. Return ONLY a raw JSON array with no markdown, no code fences, co explanation. The array must contain exactly 6 objects each with fields:{ "headline": "...", "summary": "one sentence max 20 words", "source": "Publisher name", "url": "https://...", "published": "ISO timestamp or empty string" }
Start your response with [ and end with ]. Nothing else.`,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    
    messages: [{ role: 'user', content: `Search for latest financial news: ${query}` }]
  })
  */
  const newsResponse = await fetch(
    `https://newsapi.org/v2/everything?q=${query}&pageSize=6&sortBy=publishedAt&apiKey=${process.env.NEWSAPI_KEY}`
  )
  const newsData = await newsResponse.json()
  /*
  if (response) {
    //console.log("response: ", response)
    const textBlock = response
    .content.find(item => item.type == 'text')
    const refined_text = textBlock.text.replace(/```json|```/gi,'').trim()
    console.log(refined_text)
    
    const json_text =  JSON.parse(refined_text)
    const articles = json_text.map(article => ({
      ...article, id: hashStr(article.headline), sectors: tagSectors(article.headline + ' ' + article.summary)
    }))
    const response_2 = await client.messages.create({
      model : "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `Given the articles rate the scores according to this convention score 1-3 → low impact, minor news score 4-6 → medium impact, notable but not market-moving score 7-10 → high impact, market-moving news and the confidence is a number between 0, predict a sentiment for one of the three values "bullish", "bearish" or "neutral".  and 1 return a Json array where each object has exactly {"headline","...", "score":0, "sentiment":"., confidence":0.0, "rationale":"one sentence"} no markdown, no code fences`,
      messages: [{ role: 'user', content: `predict scores of the articles: ${JSON.stringify(articles)}` }]
    })
    console.log(textBlock, response_2)
    const textBlock_2 = response_2
    .content.find(item => item.type == 'text')
    const refined_text_2 = textBlock_2.text.replace(/```json|```/gi,'').trim()
    console.log(refined_text_2)
    
    const json_text_2 =  JSON.parse(refined_text_2)
    const sortedArticles = articles.map(article =>{
      const score = json_text_2.find(s => s.headline == article.headline)
      return {...article, ...score}
    })
      */
    if(newsData){
    const json_text = newsData.articles.map(article => ({
      headline: article.title,
      summary: article.description,
      source: article.source.name,
      url: article.url,
      published: article.publishedAt
    }))
    const articles = json_text.map(article => ({
      ...article, id: hashStr(article.headline), sectors: tagSectors(article.headline + ' ' + article.summary)
    }))

    const scoredArticles = articles.map(article => ({
      ...article, ...mockScore(article)
    }))
    console.log("scored articles", scoredArticles)
    if (save){
    for (const article of scoredArticles) {
      try {
        // 1. save to PostgreSQL
        await pool.query(
          `INSERT INTO articles 
            (id, headline, summary, source, url, published, score, sentiment, confidence, rationale, sectors, query)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (id) DO NOTHING`,
          [
            article.id,
            article.headline,
            article.summary,
            article.source,
            article.url,
            article.published || null,
            article.score,
            article.sentiment,
            article.confidence,
            article.rationale,
            article.sectors,
            query
          ]
        )

      // 2. generate embedding
      const embedding = await getEmbedding(article.headline + ' ' + article.summary)
        
      
      console.log('embedding length:', embedding.length)
      console.log('article id:', article.id)
      // 3. save to Pinecone
    
      await index.upsert({
        records: [{
          id: String(article.id),
          values: Array.from(embedding),
          metadata: {
            headline: article.headline,
            source: article.source,
            score: article.score,
            sentiment: article.sentiment,
            sectors: article.sectors.join(',')
          }
        }]
      })

  } catch(err){
    console.error('Storage error for article: ', article.id, err.message)
  }
}
}
  // save search to PostgreSQL
await pool.query(
  'INSERT INTO searches (query, results_count) VALUES ($1, $2)',
  [query, scoredArticles.length]
)


    //cache.set(query, sortedArticles)
    cache.set(query, scoredArticles)
    //return Response.json({ message: 'Response received', sortedArticles})
    return Response.json({ message: 'Response received', scoredArticles})
  }
    else {
      Response.json({message: "Error please try again later"})
    }
}