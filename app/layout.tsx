import '../styles/globals.css'
import React from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import Header from '@/components/Header'

export const metadata = {
  title: 'Images by AI',
  description: 'Éditeur d\'images avec IA'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
