-- Numéro de téléphone d'un membre de la famille (texte libre, nullable)

ALTER TABLE family_members ADD COLUMN IF NOT EXISTS phone text;
