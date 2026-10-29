#!/bin/sh
# ============================================================
# Applique les migrations SQL du projet APRÈS que GoTrue ait créé le
# schéma auth (donc auth.users existe : les FK des migrations passent).
# Idempotent : une table _dev_migrations trace ce qui a déjà tourné,
# donc relancer la stack ne ré-applique pas tout.
# Exécuté par le service "migrate" du docker-compose.
# ============================================================
set -eu

PGHOST="${PGHOST:-db}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

echo "→ Attente de auth.users (créée par GoTrue)..."
until psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -tAc \
  "SELECT to_regclass('auth.users') IS NOT NULL" | grep -q t; do
  sleep 2
done
echo "  auth.users prête."

# Table de suivi des migrations dev
psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -c \
  "CREATE TABLE IF NOT EXISTS public._dev_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now());"

for file in $(ls /migrations/*.sql | sort); do
  name=$(basename "$file")
  already=$(psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -tAc \
    "SELECT 1 FROM public._dev_migrations WHERE name = '$name'")
  if [ "$already" = "1" ]; then
    echo "  = $name (déjà appliquée)"
    continue
  fi
  echo "  • $name"
  # Migration + marquage dans UNE seule transaction : soit les deux passent,
  # soit rien. Les migrations sont idempotentes (IF NOT EXISTS / guards), donc
  # si des colonnes/objets existent déjà — cas d'un état appliqué à la main —
  # la migration est un no-op et on l'enregistre quand même dans _dev_migrations.
  {
    cat "$file"
    echo ""
    echo "INSERT INTO public._dev_migrations(name) VALUES ('$name');"
  } | psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 --single-transaction
done

# Re-poser les privilèges sur les tables créées par les migrations.
# (ALTER DEFAULT PRIVILEGES du script d'init couvre le futur, mais on garantit
#  ici que TOUTES les tables présentes sont accessibles au service_role.)
echo "→ Attribution des privilèges public aux rôles Supabase"
psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 <<'SQL'
GRANT ALL    ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL    ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL    ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES    IN SCHEMA public TO anon, authenticated;
SQL

# PostgREST a démarré avant la création des tables : on force le rechargement
# de son cache de schéma, sinon il renvoie 404 sur les tables (family_members…).
# On renotifie plusieurs fois : PostgREST n'écoute le canal qu'une fois connecté,
# et le service migrate peut passer avant. Quelques rappels espacés garantissent
# qu'au moins un NOTIFY est reçu.
echo "→ Rechargement du cache de schéma PostgREST"
i=0
while [ "$i" -lt 6 ]; do
  psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "NOTIFY pgrst, 'reload schema';" >/dev/null 2>&1 || true
  i=$((i + 1))
  sleep 2
done

echo "✓ Migrations appliquées."
