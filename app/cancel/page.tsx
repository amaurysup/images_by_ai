"use client"

import { useRouter } from 'next/navigation'

export default function CancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="card text-center space-y-6">
          {/* Cancel Icon */}
          <div className="w-20 h-20 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg 
              className="w-10 h-10 text-yellow-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Paiement annulé
            </h1>
            <p className="text-slate-400">
              Vous avez annulé le processus de paiement.
            </p>
          </div>

          {/* Info */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-left space-y-2">
            <p className="text-sm text-slate-300">
              Aucun montant n'a été débité de votre compte.
            </p>
            <p className="text-sm text-slate-400">
              Vous pouvez retourner au dashboard et réessayer quand vous le souhaitez.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 rounded-lg font-semibold transition-all"
            >
              Retour au dashboard
            </button>
            <button
              onClick={() => router.back()}
              className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-all"
            >
              Retour en arrière
            </button>
          </div>

          {/* Help */}
          <div className="text-xs text-slate-500">
            Besoin d'aide ? Contactez le support
          </div>
        </div>
      </div>
    </div>
  )
}
