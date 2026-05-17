'use client'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'
import styles from './Navbar.module.css'

export default function Navbar() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <nav className={styles.nav}>
            <div className={styles.logo} onClick={() => router.push('/')}>
                <span className={styles.logoText}>Finn</span>
                <span className={styles.logoAccent}>Winn</span>
            </div>

            <div className={styles.right}>
                

                {user ? (
                    <div className={styles.dropdownWrapper} ref={dropdownRef}>
                        <button className={styles.avatar} onClick={() => setDropdownOpen(!dropdownOpen)}>
                            {user.email[0].toUpperCase()}
                        </button>

                        {dropdownOpen && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownHeader}>
                                    <p className={styles.dropdownLabel}>Signed in as</p>
                                    <p className={styles.dropdownEmail}>{user.email}</p>
                                </div>
                                <button className={styles.dropdownItem} onClick={() => { setDropdownOpen(false); router.push('/profile') }}>
                                    👤 Profile
                                </button>
                                <button className={styles.dropdownItemDanger} onClick={() => { logout(); setDropdownOpen(false); router.push('/login') }}>
                                    🚪 Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <button className={styles.btnSecondary} onClick={() => router.push('/login')}>Login</button>
                        <button className={styles.btnPrimary} onClick={() => router.push('/register')}>Register</button>
                    </>
                )}
            </div>
        </nav>
    )
}