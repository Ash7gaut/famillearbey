-- ============================================================
-- Secret Santa — groupes libres + participants (famille + externes)
-- Remplace l'ancien modèle annuel (rounds)
-- ============================================================

DROP TABLE IF EXISTS secret_santa_pairs;
DROP TABLE IF EXISTS secret_santa_exclusions;
DROP TABLE IF EXISTS secret_santa_rounds;

CREATE TABLE secret_santa_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  budget      TEXT,
  created_by  UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'drawn')),
  drawn_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_secret_santa_groups_created_by ON secret_santa_groups (created_by);

CREATE TABLE secret_santa_participants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id      UUID NOT NULL REFERENCES secret_santa_groups(id) ON DELETE CASCADE,
  member_id     UUID REFERENCES family_members(id) ON DELETE CASCADE,
  email         TEXT,
  display_name  TEXT NOT NULL,
  invite_token  UUID UNIQUE DEFAULT uuid_generate_v4(),
  status        TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'accepted', 'declined')),
  is_creator    BOOLEAN NOT NULL DEFAULT FALSE,
  responded_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT participant_source CHECK (
    (member_id IS NOT NULL AND email IS NULL)
    OR (member_id IS NULL AND email IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_ss_participant_member
  ON secret_santa_participants (group_id, member_id)
  WHERE member_id IS NOT NULL;

CREATE UNIQUE INDEX idx_ss_participant_email
  ON secret_santa_participants (group_id, email)
  WHERE email IS NOT NULL;

CREATE INDEX idx_secret_santa_participants_group ON secret_santa_participants (group_id);
CREATE INDEX idx_secret_santa_participants_token ON secret_santa_participants (invite_token);

CREATE TABLE secret_santa_pairs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id                UUID NOT NULL REFERENCES secret_santa_groups(id) ON DELETE CASCADE,
  giver_participant_id    UUID NOT NULL REFERENCES secret_santa_participants(id) ON DELETE CASCADE,
  receiver_participant_id UUID NOT NULL REFERENCES secret_santa_participants(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_giver_per_group UNIQUE (group_id, giver_participant_id)
);

ALTER TABLE secret_santa_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa_pairs ENABLE ROW LEVEL SECURITY;
