-- Migration SQL pour ajouter l'authentification

-- 1. Ajouter la colonne user_id à la table projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Activer RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Les utilisateurs peuvent voir seulement leurs projets
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Policy: Les utilisateurs peuvent insérer leurs propres projets
-- Note: Service role bypass RLS, donc cette policy s'applique uniquement aux clients authentifiés
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

-- 5. Policy: Les utilisateurs peuvent supprimer leurs propres projets
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Policy: Les utilisateurs peuvent mettre à jour leurs propres projets
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  USING (auth.uid() = user_id);
