-- ============================================================
-- FamilyHub – Famille Arbey — Schéma initial
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE relationship_type AS ENUM ('parent', 'spouse', 'sibling');

CREATE TYPE rsvp_status AS ENUM ('yes', 'no', 'maybe');

CREATE TYPE memory_type AS ENUM ('recipe', 'anecdote', 'document', 'story');

-- ============================================================
-- FAMILY MEMBERS
-- ============================================================

CREATE TABLE family_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id  UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL DEFAULT 'Arbey',
  photo_url     TEXT,
  birth_date    DATE,
  death_date    DATE,
  bio           TEXT,
  is_alive      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_family_members_name ON family_members (last_name, first_name);

-- ============================================================
-- RELATIONSHIPS (arbre généalogique)
-- ============================================================

CREATE TABLE relationships (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id           UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  related_member_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  relationship_type   relationship_type NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT no_self_relationship CHECK (member_id != related_member_id),
  CONSTRAINT unique_relationship UNIQUE (member_id, related_member_id, relationship_type)
);

CREATE INDEX idx_relationships_member ON relationships (member_id);
CREATE INDEX idx_relationships_related ON relationships (related_member_id);

-- ============================================================
-- POSTS (mur familial)
-- ============================================================

CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts (author_id);
CREATE INDEX idx_posts_created ON posts (created_at DESC);

-- ============================================================
-- COMMENTS (posts + photos)
-- ============================================================

CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  photo_id    UUID,  -- FK ajoutée après création de photos
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT comment_target CHECK (
    (post_id IS NOT NULL AND photo_id IS NULL) OR
    (post_id IS NULL AND photo_id IS NOT NULL)
  )
);

-- ============================================================
-- ALBUMS
-- ============================================================

CREATE TABLE albums (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE,
  cover_url   TEXT,
  created_by  UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_albums_event_date ON albums (event_date DESC);

-- ============================================================
-- PHOTOS
-- ============================================================

CREATE TABLE photos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id      UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  uploaded_by   UUID REFERENCES family_members(id) ON DELETE SET NULL,
  storage_path  TEXT NOT NULL,
  url           TEXT NOT NULL,
  caption       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_album ON photos (album_id);

ALTER TABLE comments
  ADD CONSTRAINT fk_comments_photo
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE;

-- ============================================================
-- PHOTO LIKES
-- ============================================================

CREATE TABLE photo_likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id    UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_photo_like UNIQUE (photo_id, member_id)
);

-- ============================================================
-- EVENTS
-- ============================================================

CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  location    TEXT,
  start_date  TIMESTAMPTZ NOT NULL,
  end_date    TIMESTAMPTZ,
  created_by  UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_start ON events (start_date);

-- ============================================================
-- RSVPS
-- ============================================================

CREATE TABLE rsvps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  status      rsvp_status NOT NULL DEFAULT 'maybe',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_event_rsvp UNIQUE (event_id, member_id)
);

-- ============================================================
-- SECRET SANTA
-- ============================================================

CREATE TABLE secret_santa_rounds (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year        INT NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE secret_santa_exclusions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id            UUID NOT NULL REFERENCES secret_santa_rounds(id) ON DELETE CASCADE,
  member_id           UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  excluded_member_id  UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,

  CONSTRAINT unique_exclusion UNIQUE (round_id, member_id, excluded_member_id)
);

CREATE TABLE secret_santa_pairs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id      UUID NOT NULL REFERENCES secret_santa_rounds(id) ON DELETE CASCADE,
  giver_id      UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  receiver_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_giver_per_round UNIQUE (round_id, giver_id)
);

-- ============================================================
-- MEMORIES (recettes, anecdotes, documents, histoires)
-- ============================================================

CREATE TABLE memories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            memory_type NOT NULL,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  author_id       UUID REFERENCES family_members(id) ON DELETE SET NULL,
  attachment_url  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memories_type ON memories (type);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_family_members_updated
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_posts_updated
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_albums_updated
  BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_events_updated
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rsvps_updated
  BEFORE UPDATE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_memories_updated
  BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (base — à affiner avec Auth)
-- ============================================================

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Policies MVP : accès service role via backend uniquement
-- En production, ajouter des policies par auth.uid()

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- À exécuter dans le dashboard Supabase ou via CLI :
-- INSERT INTO storage.buckets (id, name, public) VALUES ('albums', 'albums', true);

-- ============================================================
-- SEED DATA (exemple Famille Arbey)
-- ============================================================

INSERT INTO family_members (first_name, last_name, birth_date, bio) VALUES
  ('Jean',   'Arbey', '1950-03-15', 'Patriarche de la famille Arbey.'),
  ('Marie',  'Arbey', '1952-07-22', 'Matriarche, gardienne des traditions.'),
  ('Pierre', 'Arbey', '1978-11-03', 'Fils aîné, passionné de photographie.'),
  ('Sophie', 'Arbey', '1981-05-18', 'Fille cadette, organisatrice des réunions.'),
  ('Lucas',  'Arbey', '2005-09-10', 'Petit-fils, futur chef de la tribu.'),
  ('Emma',   'Arbey', '2008-12-25', 'Petite-fille, star des albums Noël.');

-- Relations : Jean & Marie sont conjoints
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'spouse'
FROM family_members m1, family_members m2
WHERE m1.first_name = 'Jean' AND m2.first_name = 'Marie';

INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'spouse'
FROM family_members m1, family_members m2
WHERE m1.first_name = 'Marie' AND m2.first_name = 'Jean';

-- Jean & Marie → parents de Pierre et Sophie
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT parent.id, child.id, 'parent'
FROM family_members parent, family_members child
WHERE parent.first_name IN ('Jean', 'Marie')
  AND child.first_name IN ('Pierre', 'Sophie');

-- Pierre & Sophie sont frères et sœurs
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'sibling'
FROM family_members m1, family_members m2
WHERE m1.first_name = 'Pierre' AND m2.first_name = 'Sophie';

INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT m1.id, m2.id, 'sibling'
FROM family_members m1, family_members m2
WHERE m1.first_name = 'Sophie' AND m2.first_name = 'Pierre';

-- Pierre → parent de Lucas et Emma
INSERT INTO relationships (member_id, related_member_id, relationship_type)
SELECT parent.id, child.id, 'parent'
FROM family_members parent, family_members child
WHERE parent.first_name = 'Pierre'
  AND child.first_name IN ('Lucas', 'Emma');

-- Album exemple
INSERT INTO albums (title, description, event_date)
VALUES ('Noël Arbey 2025', 'Réunion de Noël en famille', '2025-12-25');
