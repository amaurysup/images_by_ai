# Images by AI 🎨

Éditeur d'images avec IA utilisant Next.js 14, Supabase (auth + storage) et Replicate.

## ✨ Fonctionnalités

- 🔐 **Authentification** : Email/mot de passe avec Supabase Auth
- 🎨 **Génération IA** : Transformation d'images via Replicate (nano-banana)
- 💾 **Stockage** : Images dans Supabase Storage (buckets séparés input/output)
- 📊 **Dashboard** : Galerie personnelle des projets avec suppression
- 🔒 **RLS** : Row Level Security pour isoler les données par utilisateur
- 🚀 **Déployable** : Prêt pour Vercel

## 📦 Installation

```bash
npm install
```

## 🔧 Configuration

### 1. Variables d'environnement

Créer `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL="votre-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="votre-anon-key"
SUPABASE_SERVICE_ROLE_KEY="votre-service-role-key"
SUPABASE_INPUT_BUCKET="input-images"
SUPABASE_OUTPUT_BUCKET="output-images"
REPLICATE_API_TOKEN="votre-token"
REPLICATE_MODEL="google/nano-banana"
```

### 2. Configuration Supabase

#### A. Créer les buckets Storage

Dans le dashboard Supabase → Storage :
1. Créer `input-images` (Public)
2. Créer `output-images` (Public)

#### B. Exécuter la migration SQL

Dans le dashboard Supabase → SQL Editor, exécuter `supabase-migration.sql` :

```sql
-- Ajoute user_id à projects et configure RLS
ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- + policies (voir fichier complet)
```

#### C. Activer Email Auth

Dashboard Supabase → Authentication → Providers :
- Activer Email provider
- Désactiver "Confirm email" pour le dev (optionnel)

### 3. Démarrer le serveur

```bash
npm run dev
```

Ouvrir http://localhost:3000

## 🚀 Déploiement Vercel

1. Push sur GitHub
2. Connecter le repo à Vercel
3. Ajouter les variables d'environnement dans Vercel Settings
4. Deploy !

## 📁 Structure du projet

```
app/
├── page.tsx              # Landing page
├── login/page.tsx        # Page de connexion
├── signup/page.tsx       # Page d'inscription
├── dashboard/page.tsx    # Dashboard utilisateur (protégé)
├── api/
│   ├── generate/route.ts # API génération (auth requise)
│   └── delete/route.ts   # API suppression (auth requise)
components/
├── AuthForm.tsx          # Formulaire login/signup
└── Header.tsx            # Navigation avec état auth
contexts/
└── AuthContext.tsx       # Context auth global
lib/
├── supabase.ts           # Client Supabase (browser)
└── supabaseServer.ts     # Client Supabase (server)
middleware.ts             # Protection routes /dashboard et /api
```

## 🔐 Sécurité

- ✅ Middleware protège /dashboard et /api
- ✅ RLS Supabase isole les données par user
- ✅ Service Role Key utilisée côté serveur uniquement
- ✅ Vérification auth dans toutes les API routes

## 📝 TODO / Améliorations

- [ ] Confirmation email obligatoire
- [ ] Reset password
- [ ] Upload multiple images
- [ ] Historique/versioning
- [ ] Partage de projets
- [ ] Rate limiting
