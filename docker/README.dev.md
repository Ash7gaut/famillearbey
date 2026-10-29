# Environnement de développement Docker (local, perso)

> ⚠️ Ce dossier et `docker-compose.dev.yml` sont **gitignorés**.
> Ils ne partent jamais sur le repo distant et n'affectent ni railpack
> ni le déploiement. Ton frère continue avec railpack sans rien changer.

## Démarrer

```bash
docker compose -f docker-compose.dev.yml up --build     # premier lancement
docker compose -f docker-compose.dev.yml up             # ensuite
```

## Accès

| Service        | URL                          |
|----------------|------------------------------|
| Frontend (Vite)| http://localhost:5173        |
| Backend (API)  | http://localhost:3001        |
| Supabase (Kong)| http://localhost:8000        |
| Postgres       | localhost:54322 (user/db `postgres`, mdp `postgres`) |

## Commandes utiles

```bash
# Logs d'un service
docker compose -f docker-compose.dev.yml logs -f backend

# Arrêter (garde les données)
docker compose -f docker-compose.dev.yml down

# Tout réinitialiser (SUPPRIME la base + re-applique les migrations)
docker compose -f docker-compose.dev.yml down -v
```

## Notifications push (messagerie)

Le backend a besoin d'une paire de clés VAPID pour signer les envois Web Push
(package `web-push`). Génère la tienne (une seule fois, à garder secrète) :

```bash
docker run --rm node:22-slim sh -c "npx --yes web-push generate-vapid-keys"
```

Puis exporte-les avant `docker compose up` (ou mets-les dans un `.env` à la
racine, lu automatiquement par Docker Compose) :

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:ton-email@example.com
```

Sans ces variables, `pushService.isConfigured()` reste `false` et les
messages continuent de fonctionner normalement — seul l'envoi de
notifications push est silencieusement désactivé (log `[push] VAPID non
configuré`). En production (Railway), poser les mêmes variables dans les
Environment Variables du service backend.

## Comment les migrations sont appliquées

Au **premier** démarrage du volume Postgres uniquement :
1. `docker/init/00-roles.sql` — rôles Supabase + schéma `auth`.
2. `docker/init/01-apply-migrations.sh` — applique `supabase/migrations/*.sql`.

Si tu ajoutes une migration ensuite, relance avec `down -v` puis `up`
(reset complet), ou applique-la à la main via psql.

## Pourquoi ça ne casse pas le déploiement

- Aucun fichier `Dockerfile` (sans suffixe) n'existe → railpack garde son
  auto-détection Node.
- Le Dockerfile de dev s'appelle `Dockerfile.node.dev` et vit dans `docker/`.
- Tout est gitignoré → invisible pour le remote.
- Les conteneurs appellent les scripts npm existants (`npm run dev`),
  sans jamais modifier les `package.json`.
