# 🌳 FamilyHub – Famille Arbey

Plateforme privée pour centraliser les souvenirs, l'arbre généalogique et la vie de la Famille Arbey.

## Stack

| Couche    | Technologie                    |
|-----------|--------------------------------|
| Frontend  | React + Vite + TypeScript + TailwindCSS + Zustand |
| Backend   | Node.js + Express (clean architecture) |
| Database  | Supabase (PostgreSQL + Storage) |

## Structure

```
famillearbey/
├── docs/ARCHITECTURE.md       # Architecture détaillée
├── supabase/migrations/       # Schéma SQL versionné
├── backend/                   # API REST
└── frontend/                  # SPA React
```

## Démarrage rapide

### Docker (recommandé — tout tourne en local, aucun compte Supabase requis)

```bash
cp .env.example .env
docker compose up --build
```

Dans VS Code, `Ctrl+Shift+B` (tâche par défaut) lance `docker compose up --build`. La tâche « Docker: down » arrête les conteneurs.

- Frontend : `http://localhost:5173`
- Backend : `http://localhost:3001`
- API Supabase locale (Auth + REST) : `http://localhost:8000`
- Postgres (accès direct, ex. via un client SQL) : `localhost:54322` (user `postgres` / mdp `postgres`)

La stack reproduit localement les briques Supabase dont l'app dépend (Postgres, Auth/GoTrue, PostgREST) — voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ou `docker-compose.yml` pour le détail des services. Les migrations SQL de `supabase/migrations/` sont appliquées automatiquement au démarrage (une seule fois, service `migrate`).

**Non couvert en local pour l'instant :** Supabase Storage (upload de photos albums/profils) — nécessiterait un service Storage supplémentaire, pas encore ajouté.

**Réinitialiser la base locale :** `docker compose down -v` (supprime aussi les volumes Postgres).

### Sans Docker

Nécessite un projet [supabase.com](https://supabase.com) (les migrations locales ne remplacent pas Auth/Storage cloud dans ce mode).

```bash
cd backend
cp .env.example .env
# Remplir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

API disponible sur `http://localhost:3001`

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App disponible sur `http://localhost:5173`

## API (MVP)

| Méthode | Endpoint                        | Description              |
|---------|---------------------------------|--------------------------|
| GET     | `/api/v1/health`                | Santé de l'API           |
| GET     | `/api/v1/members`               | Liste des membres        |
| GET     | `/api/v1/relationships/tree`    | Arbre généalogique       |
| GET     | `/api/v1/albums`                | Liste des albums         |
| POST    | `/api/v1/albums`                | Créer un album           |
| GET     | `/api/v1/photos/album/:id`      | Photos d'un album        |
| POST    | `/api/v1/photos/album/:id`      | Upload photo (multipart) |

## Roadmap

- [x] Architecture + schéma DB
- [x] MVP : arbre généalogique + albums photos
- [ ] Mur familial
- [ ] Événements + RSVP
- [x] Tribus
- [ ] Cousinade Planner
- [ ] Secret Santa
- [ ] Mémoire familiale
- [ ] Family Arbey Wrapped
# famillearbey
