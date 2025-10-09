"use client"

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Header() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  if (loading) return null

  return (
    <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
          Images by AI
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">
                Dashboard
              </Link>
              <span className="text-sm text-slate-400">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm hover:text-violet-400 transition">
                Connexion
              </Link>
              <Link href="/signup" className="px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 rounded-lg transition">
                S'inscrire
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
