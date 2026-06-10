-- ============================================================
-- FamilyHub — Auth sur invitation (pas d'inscription libre)
-- ============================================================

-- Email d'invitation en attente (lié avant première connexion)
ALTER TABLE family_members
  ADD COLUMN invite_email TEXT UNIQUE,
  ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_family_members_invite_email ON family_members (invite_email)
  WHERE invite_email IS NOT NULL;

CREATE INDEX idx_family_members_auth_user ON family_members (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Demandes d'accès (quand quelqu'un n'a pas encore de compte)
CREATE TYPE access_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE access_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL DEFAULT 'Arbey',
  email       TEXT NOT NULL,
  message     TEXT,
  status      access_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_access_requests_status ON access_requests (status);
CREATE INDEX idx_access_requests_email ON access_requests (email);

CREATE TRIGGER trg_access_requests_updated
  BEFORE UPDATE ON access_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Promouvoir un membre admin (à adapter avec le vrai prénom)
-- UPDATE family_members SET is_admin = TRUE WHERE first_name = 'Pierre';
