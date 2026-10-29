#!/bin/sh
# ============================================================
# Seed d'un compte admin par défaut, créé à l'init du container.
#   email : admin@admin
#   mdp   : admin
# Idempotent : ne recrée rien si l'admin existe déjà.
#
# 1) crée l'utilisateur auth via l'API admin GoTrue (mot de passe hashé
#    correctement, email auto-confirmé) ;
# 2) crée/lie un family_members correspondant avec is_admin = TRUE.
# Exécuté par le service "seed" du docker-compose, après migrate + auth.
# ============================================================
set -eu

ADMIN_EMAIL="admin@admin"
ADMIN_PASSWORD="admin"

PGHOST="${PGHOST:-db}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

# curl absent de l'image postgres:15 — on l'installe (silencieux)
if ! command -v curl >/dev/null 2>&1; then
  echo "→ Installation de curl..."
  apt-get update -qq >/dev/null && apt-get install -y -qq curl >/dev/null
fi

echo "→ Attente de GoTrue (auth)..."
until curl -sf "http://kong:8000/auth/v1/health" >/dev/null 2>&1; do
  sleep 2
done
echo "  GoTrue prêt."

# 1) Créer l'utilisateur auth (idempotent : 200/201 = créé, 422 = existe déjà)
echo "→ Création de l'utilisateur auth $ADMIN_EMAIL"
resp=$(curl -s -o /tmp/seed_resp.json -w "%{http_code}" \
  -X POST "http://kong:8000/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\",\"email_confirm\":true}")

if [ "$resp" = "200" ] || [ "$resp" = "201" ]; then
  echo "  utilisateur auth créé."
elif [ "$resp" = "422" ]; then
  echo "  utilisateur auth déjà existant."
else
  echo "  ⚠ réponse inattendue ($resp) :"
  cat /tmp/seed_resp.json
fi

# 2) Récupérer l'UUID de l'utilisateur auth puis créer/lier le membre admin
echo "→ Liaison family_members (is_admin = TRUE)"
psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 <<SQL
DO \$\$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = '${ADMIN_EMAIL}' LIMIT 1;
  IF uid IS NULL THEN
    RAISE NOTICE 'Aucun auth.users pour ${ADMIN_EMAIL} — seed membre ignoré.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM family_members WHERE auth_user_id = uid) THEN
    -- déjà lié : on s'assure juste du flag admin
    UPDATE family_members SET is_admin = TRUE WHERE auth_user_id = uid;
    RAISE NOTICE 'Membre admin déjà présent, flag is_admin confirmé.';
  ELSE
    INSERT INTO family_members (auth_user_id, first_name, last_name, is_admin)
    VALUES (uid, 'Admin', 'Local', TRUE);
    RAISE NOTICE 'Membre admin créé et lié.';
  END IF;
END
\$\$;
SQL

echo "✓ Compte admin prêt : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}"
