"use client"

import React, { useState } from 'react'

export default function Page() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] ?? null
    setFile(selectedFile)
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return alert('Veuillez choisir une image')
    setLoading(true)
    setResultUrl(null)

    const form = new FormData()
    form.append('image', file)
    form.append('prompt', prompt)

    try {
      const res = await fetch('/api/generate', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      console.log('Image générée:', data.output_image_url)
      setResultUrl(data.output_image_url)
    } catch (err: any) {
      console.error(err)
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
        Images par IA
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Image d'entrée</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-violet-600 file:text-white hover:file:bg-violet-700 file:cursor-pointer"
          />
          {previewUrl && (
            <div className="mt-3">
              <img src={previewUrl} alt="Preview" className="w-full max-w-md rounded-lg border border-slate-700" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Prompt de transformation</label>
          <textarea 
            className="w-full p-3 rounded-lg border border-slate-700 bg-slate-900/50 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50" 
            rows={4} 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Décrivez la transformation souhaitée..."
          />
        </div>

        <button 
          type="submit"
          className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? '⏳ Génération en cours...' : '✨ Générer l\'image'}
        </button>
        
        {loading && (
          <div className="text-center">
            <div className="inline-block animate-pulse text-violet-400">
              🎨 Patientez pendant que l'IA travaille sur votre image...
            </div>
          </div>
        )}
      </form>

      <div className="mt-8 pt-8 border-t border-slate-700">
        {resultUrl ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-violet-300">✨ Image générée</h2>
            <div className="relative">
              <img 
                src={resultUrl} 
                alt="Generated" 
                className="w-full rounded-lg shadow-2xl border-2 border-violet-500/30"
                onError={(e) => {
                  console.error('Erreur de chargement de l\'image:', resultUrl)
                  alert('Impossible de charger l\'image. Vérifiez les permissions publiques du bucket Supabase.')
                }}
              />
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                ✓ Succès
              </div>
            </div>
            <div className="text-xs text-slate-500 text-center break-all">
              URL: {resultUrl}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">
            <div className="text-4xl mb-2">🖼️</div>
            <div>Aucune image générée pour le moment</div>
            <div className="text-xs mt-2">Uploadez une image et entrez un prompt pour commencer</div>
          </div>
        )}
      </div>
    </div>
  )
}
