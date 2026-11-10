-- Groupes WhatsApp : annuaire des groupes WhatsApp de la famille.
-- Chaque groupe porte un lien d'invitation (https://chat.whatsapp.com/...),
-- un mode d'accès (toute la famille ou accès limité à une liste de personnes),
-- une déclaration « j'y suis déjà » par membre et des signalements de lien cassé.
-- L'autorisation fine (accès au groupe, retrait réservé au créateur, lien jamais
-- renvoyé sans accès) est portée par whatsappGroupService.ts côté backend
-- (clé service-role), pas par des policies RLS : RLS activée sans policy, comme
-- les autres tables.

CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  invite_link TEXT NOT NULL,
  -- FALSE = toute la famille ; TRUE = accès limité à whatsapp_group_access.
  restricted  BOOLEAN NOT NULL DEFAULT FALSE,
  pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT whatsapp_groups_name_len CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT whatsapp_groups_description_len CHECK (description IS NULL OR char_length(description) <= 500),
  CONSTRAINT whatsapp_groups_invite_link_format CHECK (
    invite_link LIKE 'https://chat.whatsapp.com/_%'
    AND char_length(invite_link) <= 200
    AND invite_link !~ '\s'
  )
);

-- Personnes ayant accès à un groupe à accès limité (copie des membres au moment
-- de l'ajout, y compris quand on ajoute une tribu : pas de lien dynamique).
CREATE TABLE IF NOT EXISTS whatsapp_group_access (
  group_id   UUID NOT NULL REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  added_by   UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (group_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_group_access_member ON whatsapp_group_access (member_id);

-- « J'y suis déjà » : déclaration par membre.
CREATE TABLE IF NOT EXISTS whatsapp_group_members (
  group_id   UUID NOT NULL REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (group_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_group_members_member ON whatsapp_group_members (member_id);

-- « Le lien ne marche plus ? » : un signalement par membre et par groupe,
-- effacés quand le lien d'invitation est modifié.
CREATE TABLE IF NOT EXISTS whatsapp_group_link_reports (
  group_id   UUID NOT NULL REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (group_id, member_id)
);

-- updated_at auto (réutilise la fonction créée en 001).
DROP TRIGGER IF EXISTS trg_whatsapp_groups_updated ON whatsapp_groups;
CREATE TRIGGER trg_whatsapp_groups_updated
  BEFORE UPDATE ON whatsapp_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_group_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_group_link_reports ENABLE ROW LEVEL SECURITY;

-- Le lien d'invitation est un secret d'accès : aucun accès direct pour les rôles API
-- (anon/authenticated), seul le backend (service-role) lit ces tables.
REVOKE ALL ON whatsapp_groups, whatsapp_group_access, whatsapp_group_members, whatsapp_group_link_reports
  FROM PUBLIC, anon, authenticated;
