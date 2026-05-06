'use client' 
import { useState, useEffect } from "react"




function page(){
    const [input, setInput] = useState("")    // what user typed
    const [articles, setArticles] = useState([]) // results from API
    const [loading, setLoading] = useState(false) // show spinner
    const [error, setError] = useState(null)     // show error message
    const [groups, setGroups] = useState({})
    
    function groupBySector(articles){
        const grouped = {}
    
            articles.forEach(article => {
            article.sectors.forEach(sector => {
                if (!grouped[sector]) {
                    grouped[sector] = []
                }
    
                grouped[sector].push(article)
            })
        })
        return grouped
    }
    async function handleSearch(defaultQuery, save = true) {
        const searchQuery = defaultQuery || input
        setLoading(true)
        setError(null)
        try{
        const response = await fetch('/api/search',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body:JSON.stringify({ query:searchQuery, save: save}),
            
        })
        const data = await response.json()
        console.log("data", data)
        
        
        setArticles(data.scoredArticles)
        const grouped = groupBySector(data.scoredArticles)
        setGroups(grouped)
        
        
        } catch(err){
            setError('Something went wrong. Please try again.')
        }
        finally{
            setLoading(false)
        }
    }
    useEffect(() => {
        handleSearch("market news", false)
      }, [])
    return(
        
        <main className="min-h-screen p-6" style={{backgroundColor: '#f0f1f2', color: 'grey'}}>
        <header className="mb-8 border-b border-gray-800 pb-4">
            <h1 className="text-3xl font-bold">market<span style={{color: '#00d4aa'}}>pulse</span></h1>
            <p className="text-gray-400 text-sm mt-1">Real-time news impact tracker</p>
        </header>
        <div className="flex gap-2 mb-8">
        <input id= "search" type="text" 
        value={input} 
        onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
        placeholder="Search — e.g. NVIDIA earnings, Fed rates, oil prices..."
        onChange={(e) => setInput(e.target.value)} 
        className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-white placeholder-gray-400 outline-none focus:border-teal-400"
        />
        <button type="button" 
        onClick={() => {
            handleSearch()
            }} className="px-6 py-2 rounded-lg font-medium text-black" style={{backgroundColor: '#00d4aa'}}>{loading ? 'Searching...' : 'Search'}</button>
        </div>
            {error && (
    <div className="mb-6 px-4 py-3 rounded-lg border text-sm" style={{backgroundColor: '#ef444422', borderColor: '#ef4444', color: '#ef4444'}}>
        ⚠ {error}
    </div>
    )}  
        <section>
        {Object.keys(groups).length === 0 && !loading && (
    <div className="text-center py-24">
      <p className="text-5xl mb-4">◎</p>
      <p className="text-gray-500 text-lg font-medium">No headlines yet</p>
      <p className="text-gray-600 text-sm mt-1">Enter a query above to pull real-time news</p>
    </div>
  )}
            {Object.keys(groups).map(sector =>(
                <div key={sector} className="mb-8" >
                    <h3 className="text-lg font-bold mb-3 text-gray-800 uppercase tracking-widest text-sm"> {sector} </h3>
                    {groups[sector].map((article,i) =>(
                    <div key={i} className="rounded-lg p-4 mb-3 border border-gray-800" style={{backgroundColor: 'rgb(255 255 255)'}}>
                        <h2  className="font-semibold text-base mb-1 text-gray-900">{article.headline}</h2>
                        <div className="text-sm text-gray-600 mb-2" >
                        <p>{article.summary}</p>
                        <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-teal-400 ml-auto"
                        >
                        ↗ {article.source}
                        </a>

                        <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded font-medium" style={{backgroundColor: '#00d4aa22', color: '#00d4aa'}}>
              score {article.score}/10
            </span>
            <span className="text-xs px-2 py-1 rounded font-medium" style={{backgroundColor: '#ffffff21', color: '#00d4aa'}}>
                Rationale:{article.rationale}
            </span>
            <span className="text-xs px-2 py-1 rounded font-medium" style={{
              backgroundColor: article.sentiment === 'bullish' ? '#22c55e22' : article.sentiment === 'bearish' ? '#ef444422' : '#6b728022',
              color: article.sentiment === 'bullish' ? '#22c55e' : article.sentiment === 'bearish' ? '#ef4444' : '#6b7280'
            }}> {article.sentiment}</span>
            <a 
            href={article.url} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-teal-400 ml-auto"
        >
            ↗ {article.source}
        </a>
                            </div>
                        </div>

                    </div>
                    ))}
                </div>
            ))}
        </section>
        </main>
    )
}


export default page