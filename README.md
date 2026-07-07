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

### 1. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter `supabase/migrations/001_initial_schema.sql` dans le SQL Editor
3. Créer un bucket Storage nommé `albums` (public)
4. Récupérer l'URL du projet et la **service role key**

### 2. Backend

```bash
cd backend
cp .env.example .env
# Remplir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

API disponible sur `http://localhost:3001`

### 3. Frontend

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
