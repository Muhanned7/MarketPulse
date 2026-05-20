'use client' 
import { useState, useEffect, useRef } from "react"
import { useAuth } from './context/AuthContext'
import { useRouter } from 'next/navigation'



function page(){
    const [input, setInput] = useState("")    // what user typed
    const [Searchloading, setSearchLoading] = useState(false) // show spinner
    const [error, setError] = useState(null)     // show error message
    const [groups, setGroups] = useState({})
    const [similarArticles, setSimilarArticles] = useState([])
    const [watchlist, setWatchlist] = useState([])        // saved tickers
    //const [tickerInput, setTickerInput] = useState('')    // input field
    const [watchlistOpen, setWatchlistOpen] = useState(false) // collapsed/expanded
    const router = useRouter()
    const [tiles, setTiles] = useState([])
    const [tilesLoading, setTilesLoading] = useState(true)
    const scrollRef = useRef(null);


    const POPULAR_TICKERS = ['AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','JPM',
        'XOM','JNJ','WMT','BAC','PFE','CVX','NFLX','AMD','INTC','DIS','UBER','COIN']

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' 
                ? scrollLeft - clientWidth 
                : scrollLeft + clientWidth;
            
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };
        
    async function loadWatchlist() { 
        const token = localStorage.getItem('token')
       const response = await fetch('/api/watchlist', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
       const data = await response.json()
       setWatchlist(data.tickers.map(t => t.ticker) || [])

     }


     async function addTicker(ticker) { 
        if (!ticker) return
        const token = localStorage.getItem('token')
        const checkResponse = await fetch('/api/tickers')
        const checkData = await checkResponse.json()
        
        const exists = checkData.tickers.some(t => t.symbol === ticker.toUpperCase())
        
        if(!exists){
        const addResponse = await fetch('/api/tickers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: ticker })
        })
        const addData = await addResponse.json()
        if (addData.error) {
            setError(`Ticker ${ticker} not found`)
            return
          }

        
        }
         // 3. add to watchlist
        await fetch('/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ symbol: ticker })
        })
        //isWatched.append(ticker)
        setWatchlist([...watchlist, ticker])
        loadWatchlist()
        loadTiles()
      }


    // remove ticker
    async function removeTicker(symbol) { 
        const token = localStorage.getItem('token')
        const resp = await fetch('/api/watchlist', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`},
            body: JSON.stringify( {symbol })
        })
        loadWatchlist()
     }

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
        setSearchLoading(true)
        setError(null)
        //addTicker(searchQuery)
        try{
        const response = await fetch('/api/search',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body:JSON.stringify({ query:searchQuery, save: save}),
            
        })
        const data = await response.json()
        console.log("data", data)
        if (save){
        const simResponse = await fetch('/api/similar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery })
          })
        const simData = await simResponse.json()
        setSimilarArticles(simData.results.matches)
        
        }
        const grouped = groupBySector(data.scoredArticles)
        
        setGroups(grouped)
        
        
        } catch(err){
            setError('Something went wrong. Please try again.')
        }
        finally{
            setSearchLoading(false)
        }
    }
    

    async function loadTiles() {
        setTilesLoading(true)
        try {
            // fetch watchlist
            const token = localStorage.getItem('token')
            const res = await fetch('/api/watchlist', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            const tickers = data.tickers.map(t => t.ticker)

            // fetch analysis for each ticker in parallel
            // colab compute https://charcoal-smashing-headstone.ngrok-free.dev
            const results = await Promise.all(
                tickers.map(ticker =>
                    fetch(`http://localhost:8000/analyse/${ticker}`,
                         {method: 'POST'}
                    )
                        .then(r => r.json())
                        .then(data => ({ ticker, ...data.report, status: 'done' }))
                        .catch(() => ({ ticker, status: 'error' }))
                )
            )
            setTiles(results)
        } catch (err) {
            console.error(err)
        } finally {
            setTilesLoading(false)
        }
    }

    useEffect(() => {
        
        handleSearch("market news", false)
        loadWatchlist()
        loadTiles()
    }, [])
    const allTickers = [...new Set([...POPULAR_TICKERS, ...watchlist])];
    

    return(
        
        <main className="min-h-screen p-6" style={{backgroundColor: '#f0f1f2', color: 'grey'}}>
        
        <div >
            <h2> Watch List</h2>
            <div className="flex flex-wrap gap-2 mb-4">
  {allTickers.map(ticker => {
    const isWatched = watchlist.includes(ticker)
    return (
      <button
        key={ticker}
        onClick={() => {
            isWatched ? removeTicker(ticker) : addTicker(ticker)
            loadTiles()
        }}
        style={{
          backgroundColor: isWatched ? '#00d4aa' : '#e5e7eb',
          color: 'black',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {ticker}
      </button>
    )
  })}
</div>
        </div>

        {tilesLoading ? (
                <div className="text-center py-24">
                    <p className="text-5xl mb-4 animate-pulse">◎</p>
                    <p className="text-gray-500">Running agent analysis on your watchlist...</p>
                    <p className="text-gray-400 text-sm mt-1">This may take a minute</p>
                </div>
            ) : (
                <div className="relative group">
        {/* Navigation Buttons */}
        <button 
            onClick={() => scroll('left')}
            className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg border rounded-full p-2 hidden md:group-hover:block"
        >
            ←
        </button>

        {/* Sliding Container */}
        <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {tiles.map(tile => (
                <div
                    key={tile.ticker}
                    className="min-w-[25%] max-w-[25%] md:min-w-[25%] lg:min-w-[25%] snap-center bg-white rounded-xl p-5 border border-gray-200 hover:border-teal-400 transition-all flex-shrink-0"
                    
                >
                    {tile.status === 'error' ? (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{tile.ticker}</h2>
                            <p className="text-red-400 text-sm mt-2">Failed to load analysis</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-start mb-3">
                                <h2 className="text-xl font-bold text-gray-900">{tile.ticker}</h2>
                                <span className="text-xs px-2 py-1 rounded font-medium" style={{
                                    backgroundColor: tile.recommendation?.includes('buy') ? '#22c55e22' : tile.recommendation?.includes('sell') ? '#ef444422' : '#6b728022',
                                    color: tile.recommendation?.includes('buy') ? '#22c55e' : tile.recommendation?.includes('sell') ? '#ef4444' : '#6b7280'
                                }}>
                                    {tile.recommendation?.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#00d4aa22', color: '#00d4aa' }}>
                                    Target ${tile.price_target}
                                </span>
                                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#6b728022', color: '#6b7280' }}>
                                    Risk: {tile.risk_reward}
                                </span>
                            </div>

                            <p className="text-sm text-gray-500 line-clamp-3">{tile.summary}</p>

                            <button
                                className="mt-4 w-full py-2 rounded-lg text-sm font-medium text-black cursor-pointer"
                                style={{ backgroundColor: '#00d4aa' }} onClick={() => router.push(`/analysis/${tile.ticker}`)}
                            >
                                View Full Report →
                            </button>
                        </>
                    )}
                </div>
            ))}
        </div>

        <button 
            onClick={() => scroll('right')}
            className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg border rounded-full p-2 hidden md:group-hover:block"
        >
            →
        </button>
        </div>
            )}

        <div className="flex gap-2 mb-8">
        <input id= "search" type="text" 
        value={input} 
        onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
        placeholder="Search — e.g. NVIDIA earnings, Fed rates, oil prices..."
        onChange={(e) => {
            setInput(e.target.value)
        }} 
        className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-400 outline-none focus:border-teal-400"
        />
        <button type="button" 
        onClick={() => {
            handleSearch()
            }} className="px-6 py-2 rounded-lg font-medium text-black" style={{backgroundColor: '#00d4aa'}}>{Searchloading ? 'Searching...' : 'Search'}</button>
        </div>
            {error && (
    <div className="mb-6 px-4 py-3 rounded-lg border text-sm" style={{backgroundColor: '#ef444422', borderColor: '#ef4444', color: '#ef4444'}}>
        ⚠ {error}
    </div>
    )}  
        <section>
        {Object.keys(groups).length === 0 && !Searchloading && (
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
                        <span className="text-sm px-2 py-1 rounded font-medium" style={{backgroundColor: '#00d4aa22', color: '#00d4aa'}}>
              score {article.score}/10
            </span>
            <span className="text-sm px-2 py-1 rounded font-medium" style={{backgroundColor: '#ffffff21', color: '#00d4aa'}}>
                Rationale:{article.rationale}
            </span>
            <span className="text-sm px-2 py-1 rounded font-medium" style={{
              backgroundColor: article.sentiment === 'bullish' ? '#22c55e22' : article.sentiment === 'bearish' ? '#ef444422' : '#6b728022',
              color: article.sentiment === 'bullish' ? '#22c55e' : article.sentiment === 'bearish' ? '#ef4444' : '#6b7280'
            }}> {article.sentiment}</span>
            <a 
            href={article.url} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-teal-400 ml-auto"
        >
            ↗ {article.source}
        </a>
                            </div>
                        </div>

                    </div>
                    ))}
                </div>
            ))}
            {similarArticles.length > 0 && (
                <>
            <h2>Similar Articles</h2>
            {similarArticles.map((item,i)=>(
                <div key={item.id} className="mb-8">
                    <div key={i} className="rounded-lg p-4 mb-3 border border-gray-800" style={{backgroundColor: 'rgb(255 255 255)'}}>
                        <h2  className="font-semibold text-base mb-1 text-gray-900">{item.metadata.headline}</h2>
                        <div className="text-sm text-gray-600 mb-2" >
                        <p>{item.metadata.summary}</p>
                        <a 
                        href={item.metadata.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-teal-400 ml-auto"
                        >
                        ↗ {item.metadata.source}
                        </a>

                        <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded font-medium" style={{backgroundColor: '#00d4aa22', color: '#00d4aa'}}>
              score {item.metadata.score}/10
            </span>
            <span className="text-xs px-2 py-1 rounded font-medium" style={{backgroundColor: '#ffffff21', color: '#00d4aa'}}>
                Rationale:{item.metadata.rationale}
            </span>
            <span className="text-xs px-2 py-1 rounded font-medium" style={{
              backgroundColor: item.sentiment === 'bullish' ? '#22c55e22' : item.sentiment === 'bearish' ? '#ef444422' : '#6b728022',
              color: item.sentiment === 'bullish' ? '#22c55e' : item.sentiment === 'bearish' ? '#ef4444' : '#6b7280'
            }}> {item.metadata.sentiment}</span>
            <a 
            href={item.metadata.url} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-teal-400 ml-auto"
        >
            ↗ {item.source}
        </a>
                            </div>
                </div>
                </div>
            </div>
            ))}
            </>
        )} 

        
        </section>

        </main>
    )
}


export default page