import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-violet-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Images par IA
        </h1>
        
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Transformez vos images avec l'intelligence artificielle. 
          Uploadez une photo et décrivez la transformation souhaitée.
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <Link 
            href="/signup"
            className="px-8 py-4 text-lg bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 rounded-lg font-semibold transition-all shadow-lg shadow-violet-500/50"
          >
            Commencer gratuitement
          </Link>
          <Link 
            href="/login"
            className="px-8 py-4 text-lg border border-slate-700 hover:border-violet-500 rounded-lg font-semibold transition-all"
          >
            Se connecter
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="card">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold mb-2">Édition IA</h3>
            <p className="text-sm text-slate-400">
              Transformez vos images avec des prompts textuels simples
            </p>
          </div>

          <div className="card">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Rapide</h3>
            <p className="text-sm text-slate-400">
              Résultats en quelques secondes grâce à l'IA
            </p>
          </div>

          <div className="card">
            <div className="text-4xl mb-3">�</div>
            <h3 className="text-lg font-semibold mb-2">Sauvegardé</h3>
            <p className="text-sm text-slate-400">
              Toutes vos créations sont stockées dans votre dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
