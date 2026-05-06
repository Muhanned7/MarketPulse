export async function getEmbedding(text) {
      const response = await fetch('https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text, options: { wait_for_model: true } })
      }
    )
    // temporary debug
  console.log('HF status:', response.status)
  console.log('HF key loaded:', !!process.env.HUGGINGFACE_API_KEY)
    const data = await response.json()
    console.log('embedding type:', typeof data)
  console.log('is array:', Array.isArray(data))
  console.log('length:', data.length)
  console.log('first item type:', typeof data[0])
  console.log('first item is array:', Array.isArray(data[0]))
  if (Array.isArray(data[0])) {
    console.log('nested length:', data[0].length)
  }
   return data
  }