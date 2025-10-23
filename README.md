# 🎨 AI Image Editor - Next.js + Supabase + Stripe + Replicate

Éditeur d'images alimenté par l'IA avec système de paiement à la génération.

## ✨ Fonctionnalités

- 🔐 **Authentification** : Email/mot de passe avec Supabase Auth
- 🎨 **Génération IA** : Transformation d'images via Replicate (nano-banana)
- 💳 **Paiement à l'usage** : Stripe Checkout - 2€ par génération
- 🪝 **Webhooks Stripe** : Vérification automatique des paiements
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
# Supabase
NEXT_PUBLIC_SUPABASE_URL="votre-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="votre-anon-key"
SUPABASE_SERVICE_ROLE_KEY="votre-service-role-key"
SUPABASE_INPUT_BUCKET="input-images"
SUPABASE_OUTPUT_BUCKET="output-images"

# Replicate
REPLICATE_API_TOKEN="votre-token"
REPLICATE_MODEL="google/nano-banana"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
NEXT_PUBLIC_URL="http://localhost:3000"
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

### 3. Configurer Stripe

**Guide détaillé** : Voir [`STRIPE_SETUP.md`](./STRIPE_SETUP.md)

**Résumé rapide** :

```bash
# Installer Stripe CLI
scoop install stripe  # Windows
brew install stripe/stripe-cli/stripe  # Mac/Linux

# Se connecter
stripe login

# Lancer le webhook listener (garde cette commande active)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copier le whsec_xxxxx affiché dans .env.local
```

### 4. Démarrer le serveur

```bash
npm run dev
```

Ouvrir http://localhost:3000

**Important** : Gardez `stripe listen` actif dans un terminal séparé pendant le développement.

## 🚀 Déploiement Vercel

1. Push sur GitHub
2. Connecter le repo à Vercel
3. Ajouter les variables d'environnement dans Vercel Settings
4. Deploy !

## � Flow utilisateur

```
1. S'inscrire / Se connecter
2. Aller au Dashboard
3. Upload une image + prompt
4. Cliquer "Continuer vers le paiement (2€)"
5. Payer sur Stripe Checkout (carte test: 4242 4242 4242 4242)
6. Retour au dashboard → projet marqué "✅ Payé"
7. Cliquer "✨ Lancer la génération"
8. L'image générée apparaît dans la galerie
```

## �📁 Structure du projet

```
app/
├── page.tsx                        # Landing page
├── login/page.tsx                  # Page de connexion
├── signup/page.tsx                 # Page d'inscription
├── dashboard/page.tsx              # Dashboard utilisateur (protégé)
├── success/page.tsx                # Page après paiement réussi
├── cancel/page.tsx                 # Page après annulation paiement
├── api/
│   ├── create-checkout-session/    # Créer session Stripe + upload image
│   ├── webhooks/stripe/            # Recevoir événements Stripe
│   ├── generate/route.ts           # Générer image avec Replicate (vérifie paiement)
│   └── delete/route.ts             # Supprimer projet
components/
├── AuthForm.tsx                    # Formulaire login/signup
└── Header.tsx                      # Navigation avec état auth
contexts/
└── AuthContext.tsx                 # Context auth global
lib/
└── supabase.ts                     # Client Supabase
middleware.ts                       # Protection routes /dashboard et /api
STRIPE_SETUP.md                     # Guide complet Stripe
```

## 🔐 Sécurité

- ✅ Middleware protège /dashboard et /api
- ✅ RLS Supabase isole les données par user
- ✅ Service Role Key utilisée côté serveur uniquement
- ✅ Vérification auth dans toutes les API routes

## 🧪 Tests

### Carte de test Stripe

- **Numéro** : `4242 4242 4242 4242`
- **Date** : N'importe quelle date future
- **CVC** : N'importe quel code 3 chiffres

### Vérifier les webhooks

Dans le terminal où `stripe listen` est actif, vous devriez voir :

```
✅ Webhook reçu: checkout.session.completed
� Paiement complété pour projet: <uuid>
✅ Projet mis à jour avec payment_status=paid
```

## 🐛 Dépannage

### Le webhook ne fonctionne pas
- Vérifiez que `stripe listen` est actif
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct dans `.env.local`
- Redémarrez le serveur Next.js

### Erreur "Bucket not found"
- Vérifiez que les buckets `input-images` et `output-images` existent
- Vérifiez qu'ils sont publics

### Le bouton "Lancer la génération" n'apparaît pas
- Vérifiez que le paiement a bien été complété
- Vérifiez les logs du webhook dans le terminal `stripe listen`
- Rafraîchissez le dashboard

## �📝 TODO / Améliorations

- [ ] Confirmation email obligatoire
- [ ] Reset password
- [ ] Upload multiple images
- [ ] Plans d'abonnement (au lieu de pay-per-use)
- [ ] Historique/versioning
- [ ] Partage de projets
- [ ] Rate limiting
- [ ] Mode test Stripe sans vraie carte

## 📚 Documentation

- [Guide Stripe complet](./STRIPE_SETUP.md)
- [Supabase Docs](https://supabase.com/docs)
- [Replicate Docs](https://replicate.com/docs)
- [Stripe Docs](https://docs.stripe.com/)
- [Next.js Docs](https://nextjs.org/docs)
