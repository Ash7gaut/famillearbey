-- Genre du membre, désormais stocké en base (avant : deviné côté front à partir
-- du prénom, via des listes en dur — peu fiable).
-- Par défaut tout le monde est 'male' ; les valeurs réelles seront ajustées
-- ensuite à la main / via l'écran de gestion des membres.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_gender') THEN
    CREATE TYPE member_gender AS ENUM ('male', 'female');
  END IF;
END $$;

ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS gender member_gender NOT NULL DEFAULT 'male';

COMMENT ON COLUMN family_members.gender IS
  'Genre du membre (male/female). Défaut male ; à ajuster manuellement.';
