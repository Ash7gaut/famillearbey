-- ============================================================
-- Secret Santa : listes de souhaits par participant
-- + cases « je prends ça » du tireur (table séparée : le tiré ne les voit jamais)
-- Accès via le service role du backend uniquement (RLS sans policy, comme 004).
-- ============================================================

-- Présente en base réelle mais absente des migrations précédentes (idempotent).
ALTER TABLE secret_santa_participants
  ADD COLUMN IF NOT EXISTS revealed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS secret_santa_wishlist_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id  UUID NOT NULL REFERENCES secret_santa_participants(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  url             TEXT,
  image_url       TEXT,
  price           TEXT,
  note            TEXT,
  position        INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ss_wishlist_items_participant
  ON secret_santa_wishlist_items (participant_id);

CREATE TABLE IF NOT EXISTS secret_santa_wishlist_picks (
  item_id              UUID NOT NULL REFERENCES secret_santa_wishlist_items(id) ON DELETE CASCADE,
  giver_participant_id UUID NOT NULL REFERENCES secret_santa_participants(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, giver_participant_id)
);

CREATE INDEX IF NOT EXISTS idx_ss_wishlist_picks_giver
  ON secret_santa_wishlist_picks (giver_participant_id);

ALTER TABLE secret_santa_wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa_wishlist_picks ENABLE ROW LEVEL SECURITY;
