-- Configuration d'un groupe de messagerie :
--  * image et description du groupe (renommer = colonne title existante)
--  * personne ne peut retirer un membre d'un groupe (pas de "quitter le groupe") :
--    DELETE verrouillé au niveau SQL, en plus de l'absence d'endpoint backend
--  * bump_conversation : search_path figé

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_description_len;
ALTER TABLE conversations ADD CONSTRAINT conversations_description_len
  CHECK (description IS NULL OR char_length(description) <= 500);

CREATE OR REPLACE FUNCTION bump_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Aucun rôle API ne peut supprimer d'appartenance (la RLS sans policy DELETE le garantissait déjà).
REVOKE DELETE ON conversation_members FROM PUBLIC, anon, authenticated;

-- Même la clé service-role (backend) ne peut pas supprimer directement une ligne :
-- seules les suppressions en cascade (suppression de la conversation ou du membre
-- lui-même, trigger RI => profondeur >= 2) sont autorisées.
CREATE OR REPLACE FUNCTION forbid_conversation_member_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() < 2 THEN
    RAISE EXCEPTION 'Retirer un membre d''un groupe est interdit' USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_conversation_members_no_delete ON conversation_members;
CREATE TRIGGER trg_conversation_members_no_delete
  BEFORE DELETE ON conversation_members
  FOR EACH ROW EXECUTE FUNCTION forbid_conversation_member_delete();
