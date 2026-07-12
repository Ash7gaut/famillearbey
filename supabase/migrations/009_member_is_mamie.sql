-- Membre "mamie" : la grand-mère qui sert de racine à l'arbre généalogique
-- (et pourra servir de point de référence ailleurs plus tard).
-- Un seul membre peut être mamie à la fois — garanti par un index unique partiel.

ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS is_mamie BOOLEAN NOT NULL DEFAULT FALSE;

-- Au plus une seule ligne avec is_mamie = TRUE.
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_members_single_mamie
  ON family_members ((TRUE))
  WHERE is_mamie;

COMMENT ON COLUMN family_members.is_mamie IS
  'TRUE pour LA grand-mère racine de l''arbre. Un seul membre à la fois.';
