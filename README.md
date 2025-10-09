# Images by AI

Projet Next.js (TypeScript) minimal pour un éditeur d'images utilisant Supabase pour le stockage et Replicate pour la génération IA.

Variables d'environnement (placer dans `.env.local`):

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_INPUT_BUCKET=input-images
- SUPABASE_OUTPUT_BUCKET=output-images
- REPLICATE_API_TOKEN
- REPLICATE_MODEL=google/nano-banana

Installation:

1. npm install
2. npm run dev
