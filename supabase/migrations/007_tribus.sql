-- ============================================================
-- TRIBUS (regroupement de membres pour la Cousinade — un "chef de
-- tribu" répond au nom de tous les membres qui n'ont pas forcément
-- de compte, ex. les enfants ou les grands-parents)
-- ============================================================

CREATE TABLE tribus (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label           TEXT,
  chef_member_id  UUID NOT NULL REFERENCES family_members(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tribus_chef ON tribus (chef_member_id);

CREATE TRIGGER trg_tribus_updated
  BEFORE UPDATE ON tribus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Note : contrairement aux autres FK vers family_members (souvent
-- ON DELETE SET NULL/CASCADE), on utilise RESTRICT ici : une tribu
-- sans chef n'a pas de sens, donc on bloque la suppression d'un
-- membre tant qu'il est chef d'une tribu plutôt que de l'orpheliner.

-- ============================================================
-- TRIBU MEMBERS (chaque membre appartient à au plus une tribu)
-- ============================================================

CREATE TABLE tribu_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tribu_id    UUID NOT NULL REFERENCES tribus(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_member_tribu UNIQUE (member_id)
);

CREATE INDEX idx_tribu_members_tribu ON tribu_members (tribu_id);

-- Le chef doit lui-même être membre de sa tribu — assuré par la
-- couche service (tribuService.create), pas par contrainte SQL.

ALTER TABLE tribus ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribu_members ENABLE ROW LEVEL SECURITY;

-- Policies MVP : accès service role via backend uniquement (cf. 001)
