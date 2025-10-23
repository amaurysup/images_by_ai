"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'

function SuccessContent() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="card text-center space-y-6">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <svg 
              className="w-10 h-10 text-green-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Paiement réussi ! 🎉
            </h1>
            <p className="text-slate-400">
              Votre paiement a été confirmé avec succès.
            </p>
          </div>

          {/* Info */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Montant payé</span>
              <span className="font-semibold text-green-400">2,00 €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Statut</span>
              <span className="font-semibold text-green-400">✅ Confirmé</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              💡 Retournez au dashboard pour lancer la génération de votre image
            </p>
          </div>

          {/* Redirect countdown */}
          <div className="text-sm text-slate-400">
            Redirection automatique dans <span className="font-bold text-violet-400">{countdown}</span> secondes...
          </div>

          {/* Manual button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 rounded-lg font-semibold transition-all"
          >
            Retour au dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Chargement...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
