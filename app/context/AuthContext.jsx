'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
console.log("1. AuthContext.js: File is being evaluated");
    
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    console.log("2. AuthProvider: Component is rendering");
    useEffect(() => {
        const token = localStorage.getItem('token')
        const email = localStorage.getItem('email')
        if (token && email) {
            setUser({ token, email })
        }
        setLoading(false)
    }, [])

    function logout() {
        localStorage.removeItem('token')
        localStorage.removeItem('email')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    console.log("3. useAuth: Hook is being called by a component");
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}