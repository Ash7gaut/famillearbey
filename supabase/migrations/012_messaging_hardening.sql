-- Durcissement de la messagerie (suite à l'audit perf/coûts) :
--  * limites de taille sur les messages et titres
--  * messages.author_id : SET NULL à la suppression d'un membre (on garde l'historique des autres)
--  * trigger qui remonte la conversation à chaque message (remplace un UPDATE côté backend)
--  * list_conversations : une seule requête au lieu de 3 par conversation
--  * is_conversation_member : plus appelable en anonyme via /rpc
--  * index sur family_members.auth_user_id (évalué par la policy Realtime)

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_len;
ALTER TABLE messages ADD CONSTRAINT messages_content_len CHECK (char_length(content) BETWEEN 1 AND 4000);

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_title_len;
ALTER TABLE conversations ADD CONSTRAINT conversations_title_len CHECK (title IS NULL OR char_length(title) <= 100);

ALTER TABLE messages ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_author_id_fkey;
ALTER TABLE messages
  ADD CONSTRAINT messages_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES family_members(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION bump_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_bump ON messages;
CREATE TRIGGER trg_messages_bump
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION bump_conversation();

CREATE INDEX IF NOT EXISTS idx_family_members_auth_user ON family_members (auth_user_id);

-- La policy Realtime s'exécute avec le rôle "authenticated" : il garde EXECUTE,
-- mais plus "anon" ni PUBLIC.
REVOKE EXECUTE ON FUNCTION is_conversation_member(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_conversation_member(UUID) TO authenticated, service_role;

-- Liste des conversations d'un membre (dernier message, non-lus, membres) en un seul aller-retour.
-- Appelée uniquement par le backend (service-role) : le membre est passé en paramètre,
-- donc aucun autre rôle ne doit pouvoir l'exécuter.
CREATE OR REPLACE FUNCTION list_conversations(p_member UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(s.x ORDER BY s.updated_at DESC), '[]'::jsonb)
  FROM (
    SELECT
      c.updated_at,
      to_jsonb(c) || jsonb_build_object(
        'muted', cm.muted,
        'unread_count', (
          SELECT count(*) FROM messages m
          WHERE m.conversation_id = c.id
            AND m.created_at > cm.last_read_at
            AND m.author_id IS DISTINCT FROM p_member
        ),
        'last_message', (
          SELECT to_jsonb(m) FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ),
        'members', (
          SELECT COALESCE(jsonb_agg(to_jsonb(fm)), '[]'::jsonb)
          FROM conversation_members cm2
          JOIN family_members fm ON fm.id = cm2.member_id
          WHERE cm2.conversation_id = c.id
        )
      ) AS x
    FROM conversation_members cm
    JOIN conversations c ON c.id = cm.conversation_id
    WHERE cm.member_id = p_member
  ) s;
$$;

REVOKE EXECUTE ON FUNCTION list_conversations(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION list_conversations(UUID) TO service_role;
