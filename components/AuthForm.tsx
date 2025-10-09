"use client"

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

type AuthFormProps = {
  mode: 'login' | 'signup'
}

export default function AuthForm({ mode: initialMode }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signUp(email, password)
        alert('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.')
      } else {
        await signIn(email, password)
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          <button
            onClick={() => setMode('login')}
            className={`pb-2 px-4 ${mode === 'login' ? 'border-b-2 border-violet-500 text-violet-400' : 'text-slate-400'}`}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`pb-2 px-4 ${mode === 'signup' ? 'border-b-2 border-violet-500 text-violet-400' : 'text-slate-400'}`}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-lg border border-slate-700 bg-slate-900/50 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-3 rounded-lg border border-slate-700 bg-slate-900/50 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              placeholder="••••••••"
            />
            {mode === 'signup' && (
              <p className="text-xs text-slate-400 mt-1">Minimum 6 caractères</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Chargement...' : mode === 'signup' ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
