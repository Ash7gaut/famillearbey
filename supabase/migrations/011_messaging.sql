-- Messagerie de groupe.
-- Une conversation est créée par un admin ; tout membre de la conversation
-- peut ensuite y ajouter ou en retirer d'autres membres (y compris lui-même).
-- L'autorisation fine (appartenance à la conversation, etc.) est portée par
-- messagingService.ts côté backend, pas par des policies RLS (cf. pattern
-- existant : accès via la clé service-role côté backend uniquement).

CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT,
  created_by  UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  member_id        UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  added_by         UUID REFERENCES family_members(id) ON DELETE SET NULL,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  muted            BOOLEAN NOT NULL DEFAULT FALSE,
  last_read_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (conversation_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_member ON conversation_members (member_id);

CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  author_id        UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id     UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  endpoint      TEXT NOT NULL UNIQUE,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_member ON push_subscriptions (member_id);

-- updated_at auto (réutilise la fonction créée en 001).
DROP TRIGGER IF EXISTS trg_conversations_updated ON conversations;
CREATE TRIGGER trg_conversations_updated
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Realtime : permet l'écoute des nouveaux messages côté front.
-- Realtime applique la RLS avec le JWT de l'utilisateur : sans policy SELECT
-- pour "authenticated", aucun événement n'est délivré. La fonction est
-- SECURITY DEFINER pour ne pas être filtrée par la RLS de conversation_members.
CREATE OR REPLACE FUNCTION is_conversation_member(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversation_members cm
    JOIN family_members fm ON fm.id = cm.member_id
    WHERE cm.conversation_id = p_conversation_id
      AND fm.auth_user_id = (SELECT auth.uid())
  );
$$;

DROP POLICY IF EXISTS messages_select_members ON messages;
CREATE POLICY messages_select_members ON messages
  FOR SELECT TO authenticated
  USING (is_conversation_member(conversation_id));

-- La publication "supabase_realtime" est créée par docker/init/00-roles.sql
-- en dev (existe par défaut sur Supabase Cloud en prod). Idempotent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;
