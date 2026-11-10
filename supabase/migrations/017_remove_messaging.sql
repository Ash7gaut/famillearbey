-- Retrait de la Messagerie (remplacée par les Groupes WhatsApp, cf. 016).
-- À appliquer SÉPARÉMENT de 016, après déploiement du backend sans messagerie.
-- Les notifications push (push_subscriptions) ne servaient qu'aux messages : supprimées aussi.
-- Les tables sortent de la publication supabase_realtime en même temps qu'elles sont supprimées.
-- NB : les images de groupe stockées dans le bucket "albums" sous "conversations/" ne sont pas
-- supprimées par ce script (Storage) : à purger à part si on le souhaite.

-- Tables d'abord (la policy Realtime de "messages" dépend de is_conversation_member).
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_members CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;

DROP FUNCTION IF EXISTS list_conversations(UUID);
DROP FUNCTION IF EXISTS is_conversation_member(UUID);
DROP FUNCTION IF EXISTS bump_conversation();
DROP FUNCTION IF EXISTS forbid_conversation_member_delete();
