'use client'
import { useAuth } from '../context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import styles from './Sidebar.module.css'

export default function Sidebar() {
    const { user } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [watchlist, setWatchlist] = useState([])

    useEffect(() => {
        if (user) loadWatchlist()
    }, [user])

    async function loadWatchlist() {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/watchlist', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setWatchlist(data.tickers?.map(t => t.ticker) || [])
    }

    if (!user) return null

    return (
        <aside className={styles.sidebar}>
            {/* Navigation */}
            <div className={styles.section}>
                <p className={styles.sectionLabel}>Navigation</p>
                <button
                    className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}
                    onClick={() => router.push('/')}
                >
                    📰 News Feed
                </button>
                <button
                    className={`${styles.navItem} ${pathname === '/analysis' ? styles.active : ''}`}
                    onClick={() => router.push('/analysis')}
                >
                    🤖 AI Analysis
                </button>
                <button
                    className={`${styles.navItem} ${pathname === '/profile' ? styles.active : ''}`}
                    onClick={() => router.push('/profile')}
                >
                    👤 Profile
                </button>
            </div>

            {/* Watchlist */}
            <div className={styles.section}>
                <p className={styles.sectionLabel}>Watchlist</p>
                {watchlist.length === 0 ? (
                    <p className={styles.empty}>No tickers yet</p>
                ) : (
                    watchlist.map(ticker => (
                        <button
                            key={ticker}
                            className={`${styles.tickerItem} ${pathname === `/analysis/${ticker}` ? styles.active : ''}`}
                            onClick={() => router.push(`/analysis/${ticker}`)}
                        >
                            <span className={styles.tickerSymbol}>{ticker}</span>
                            <span className={styles.tickerArrow}>→</span>
                        </button>
                    ))
                )}
            </div>

            {/* Notes — coming soon */}
            <div className={styles.section}>
                <p className={styles.sectionLabel}>Notes</p>
                <p className={styles.empty}>Coming soon</p>
            </div>
        </aside>
    )
}