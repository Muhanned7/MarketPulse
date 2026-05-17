'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'

export default function Analysis() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [tiles, setTiles] = useState([])
    const [tilesLoading, setTilesLoading] = useState(true)

    useEffect(() => {
        if (loading) return
        if (!user) {
            router.push('/login')
            return
        }
        loadTiles()
    }, [user, loading])

    async function loadTiles() {
        setTilesLoading(true)
        try {
            // fetch watchlist
            const res = await fetch('/api/watchlist')
            const data = await res.json()
            const tickers = data.tickers.map(t => t.ticker)

            // fetch analysis for each ticker in parallel
            const results = await Promise.all(
                tickers.map(ticker =>
                    fetch(`http://localhost:8000/analyse/${ticker}`)
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

    if (loading || !user) return null

    return (
        <main className="min-h-screen p-6" style={{ backgroundColor: '#f0f1f2' }}>
            <header className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">market<span style={{ color: '#00d4aa' }}>pulse</span></h1>
                    <p className="text-gray-400 text-sm mt-1">AI Stock Analysis</p>
                </div>
                <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-teal-400">
                    ← Back to News
                </button>
            </header>

            {tilesLoading ? (
                <div className="text-center py-24">
                    <p className="text-5xl mb-4 animate-pulse">◎</p>
                    <p className="text-gray-500">Running agent analysis on your watchlist...</p>
                    <p className="text-gray-400 text-sm mt-1">This may take a minute</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tiles.map(tile => (
                        <div
                            key={tile.ticker}
                            className="bg-white rounded-xl p-5 border border-gray-200 cursor-pointer hover:border-teal-400 transition-all"
                            onClick={() => router.push(`/analysis/${tile.ticker}`)}
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
                                        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#6b728022', color: '#6b7280' }}>
                                            Conviction: {tile.conviction}/10
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-500 line-clamp-3">{tile.summary}</p>

                                    <button
                                        className="mt-4 w-full py-2 rounded-lg text-sm font-medium text-black"
                                        style={{ backgroundColor: '#00d4aa' }}
                                    >
                                        View Full Report →
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}