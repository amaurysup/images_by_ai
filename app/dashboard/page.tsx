"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Project = {
  id: string
  created_at: string
  input_image_url: string
  output_image_url: string
  prompt: string
  status: string
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  async function fetchProjects() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
    } finally {
      setLoadingProjects(false)
    }
  }

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

    const form = new FormData()
    form.append('image', file)
    form.append('prompt', prompt)

    try {
      const res = await fetch('/api/generate', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      alert('Image générée avec succès !')
      fetchProjects() // Refresh projects
      setFile(null)
      setPreviewUrl(null)
      setPrompt('')
    } catch (err: any) {
      console.error(err)
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(projectId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return

    try {
      const res = await fetch('/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (!res.ok) throw new Error(await res.text())
      alert('Projet supprimé')
      fetchProjects()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
          Mon Dashboard
        </h1>

        {/* Upload form */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Générer une nouvelle image</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <textarea
                className="w-full p-3 rounded-lg border border-slate-700 bg-slate-900/50 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Décrivez la transformation..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Génération...' : '✨ Générer'}
            </button>
          </form>
        </div>

        {/* Projects gallery */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Mes projets</h2>
          {loadingProjects ? (
            <div className="text-slate-400">Chargement des projets...</div>
          ) : projects.length === 0 ? (
            <div className="text-slate-400 text-center py-8">Aucun projet pour le moment</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="border border-slate-700 rounded-lg overflow-hidden">
                  <img src={project.output_image_url} alt="Generated" className="w-full h-48 object-cover" />
                  <div className="p-3">
                    <p className="text-sm text-slate-300 mb-2">{project.prompt}</p>
                    <p className="text-xs text-slate-500 mb-2">
                      {new Date(project.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
