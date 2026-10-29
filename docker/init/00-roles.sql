-- ============================================================
-- 00 — Rôles & schéma attendus par la stack Supabase locale.
-- Exécuté UNE fois, au premier init du volume Postgres.
-- Idempotent : réutilise le mot de passe POSTGRES_PASSWORD.
-- ============================================================

-- Rôles applicatifs Supabase -------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

-- Rôle de login que PostgREST utilise, capable d'endosser les rôles ci-dessus
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    EXECUTE format(
      'CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD %L',
      current_setting('custom.pgpass', true)
    );
  END IF;
END
$$;

-- Mot de passe = POSTGRES_PASSWORD (passé via -c au run, cf. note plus bas).
-- On force ici avec la valeur par défaut 'postgres' pour le cas dev simple.
ALTER ROLE authenticator WITH PASSWORD 'postgres';

GRANT anon, authenticated, service_role TO authenticator;

-- Rôle d'admin pour GoTrue (gère le schéma auth) ----------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin LOGIN NOINHERIT CREATEROLE PASSWORD 'postgres';
  END IF;
END
$$;

-- Schéma auth : GoTrue en est PROPRIÉTAIRE et crée toutes ses tables
-- (users, refresh_tokens, ...). On ne crée PAS auth.users ici, sinon
-- GoTrue ne pourrait pas en devenir owner (erreur "must be owner").
-- Les migrations du projet (qui référencent auth.users) sont appliquées
-- APRÈS le démarrage de GoTrue, par le service "migrate" du compose.
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- GoTrue crée ses tables dans "auth" mais les requête sans préfixe au login.
-- Sans ce search_path, il cherche "users" dans "public" → relation introuvable
-- (erreur "Database error querying schema"). On force donc auth en tête.
ALTER ROLE supabase_auth_admin SET search_path = auth, public;

-- Schéma storage (référencé par PostgREST) ----------------------------------
CREATE SCHEMA IF NOT EXISTS storage;

-- Droits d'usage sur public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Privilèges sur les tables du schéma public.
-- Sur Supabase cloud ces GRANT sont posés automatiquement ; en local on les
-- reproduit, sinon le backend (service_role via PostgREST) reçoit
-- "permission denied for table ..." → profils introuvables (NOT_LINKED).
-- ALTER DEFAULT PRIVILEGES couvre les tables créées PLUS TARD par les migrations.
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon, authenticated;

-- GoTrue crée sa table interne schema_migrations dans le schéma public :
-- sur Postgres 15, CREATE sur public n'est plus implicite → on l'accorde.
GRANT ALL ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth   TO supabase_auth_admin;

-- Rôle d'admin pour Supabase Realtime (écoute la réplication logique) -------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_realtime_admin') THEN
    CREATE ROLE supabase_realtime_admin LOGIN NOINHERIT CREATEROLE REPLICATION PASSWORD 'postgres';
  END IF;
END
$$;

-- DEV LOCAL UNIQUEMENT : les migrations internes de Realtime font
-- SET log_min_messages (paramètre réservé aux superusers). L'image postgres
-- standard n'est pas supabase/postgres (où ce rôle a les droits requis), donc
-- on le passe SUPERUSER. Ne JAMAIS reproduire en production.
ALTER ROLE supabase_realtime_admin SUPERUSER;

CREATE SCHEMA IF NOT EXISTS realtime AUTHORIZATION supabase_realtime_admin;
GRANT ALL ON SCHEMA public TO supabase_realtime_admin;
GRANT USAGE ON SCHEMA public TO supabase_realtime_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO supabase_realtime_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO supabase_realtime_admin;

-- Publication utilisée par Supabase Realtime pour diffuser les changements.
-- Les tables y sont ajoutées explicitement (cf. 011_messaging.sql pour "messages").
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
