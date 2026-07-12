-- Tribus : regroupements simples de membres.
-- Un membre appartient à AU PLUS UNE tribu (tribu_id sur family_members).

CREATE TABLE IF NOT EXISTS tribus (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT, -- couleur d'identification (ex. "#c66434")
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appartenance : un membre → une tribu (ou aucune). Si la tribu est supprimée,
-- les membres sont simplement détachés (tribu_id repasse à NULL).
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS tribu_id UUID REFERENCES tribus(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_family_members_tribu ON family_members (tribu_id)
  WHERE tribu_id IS NOT NULL;

-- updated_at auto (réutilise la fonction créée en 001).
DROP TRIGGER IF EXISTS trg_tribus_updated ON tribus;
CREATE TRIGGER trg_tribus_updated
  BEFORE UPDATE ON tribus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE tribus ENABLE ROW LEVEL SECURITY;
