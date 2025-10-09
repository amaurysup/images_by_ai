import '../styles/globals.css'
import React from 'react'

export const metadata = {
  title: 'Images by AI',
  description: 'Éditeur d\'images avec IA'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-3xl">{children}</div>
        </main>
      </body>
    </html>
  )
}
