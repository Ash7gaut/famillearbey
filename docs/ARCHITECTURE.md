# FamilyHub – Famille Arbey — Architecture

## Vue d'ensemble

Application web privée pour la Famille Arbey. Architecture **monorepo** avec séparation stricte frontend / backend.

```
famillearbey/
├── docs/                    # Documentation
├── supabase/
│   └── migrations/          # Schéma PostgreSQL versionné
├── backend/                 # API REST Node.js + Express
│   └── src/
│       ├── config/          # Variables d'environnement, client Supabase
│       ├── controllers/     # Couche HTTP (req/res)
│       ├── services/        # Logique métier
│       ├── routes/          # Définition des endpoints
│       ├── middleware/      # Auth, erreurs, validation
│       └── types/           # Types TypeScript partagés côté API
└── frontend/                # SPA React (Vite)
    └── src/
        ├── components/      # UI réutilisable
        ├── pages/           # Routes / écrans
        ├── stores/          # État global (Zustand)
        ├── services/        # Client API HTTP
        └── types/           # Types TypeScript côté client
```

## Flux de données

```
┌─────────────┐     HTTP/REST      ┌─────────────┐     Supabase SDK    ┌──────────────┐
│   React     │ ─────────────────► │   Express   │ ──────────────────► │  PostgreSQL  │
│  (Vite)     │ ◄───────────────── │   API       │ ◄────────────────── │  + Storage   │
└─────────────┘     JSON           └─────────────┘                     └──────────────┘
```

- Le **frontend** ne parle jamais directement à Supabase en production (sauf upload Storage si besoin futur).
- Le **backend** centralise l'accès aux données via le service role key Supabase.
- **Supabase Auth** (optionnel MVP) : middleware `auth` vérifie le JWT, lie `auth.users` → `family_members`.

## Clean Architecture (Backend)

| Couche       | Responsabilité                                      |
|--------------|-----------------------------------------------------|
| `routes`     | Mapping URL → controller, middlewares               |
| `controllers`| Parse requête, appelle service, formate réponse     |
| `services`   | Logique métier, requêtes Supabase                   |
| `config`     | Client Supabase singleton, env vars                 |

### Conventions API

- Préfixe : `/api/v1`
- Réponses succès : `{ data: T }` ou `{ data: T[], meta?: {} }`
- Erreurs : `{ error: { message, code? } }`
- Codes HTTP standards (200, 201, 400, 404, 500)

## Modules fonctionnels (roadmap)

| Module            | Priorité MVP | Statut   |
|-------------------|--------------|----------|
| Arbre généalogique| Haute        | ✅ MVP   |
| Albums photos     | Haute        | ✅ MVP   |
| Mur familial      | Moyenne      | Phase 2  |
| Événements + RSVP | Moyenne      | Phase 2  |
| Secret Santa      | Moyenne      | Phase 2  |
| Mémoire familiale | Basse        | Phase 3  |
| Family Wrapped    | Bonus        | Phase 4  |

## Stack technique

| Couche    | Technologie                          |
|-----------|--------------------------------------|
| Frontend  | React 18, Vite, TypeScript, Tailwind |
| Routing   | React Router v6                      |
| State     | Zustand                              |
| Backend   | Node.js, Express, TypeScript         |
| Database  | Supabase (PostgreSQL)                |
| Storage   | Supabase Storage (`albums` bucket)   |
| Auth      | Supabase Auth (préparé, optionnel)   |

## Sécurité

- Variables sensibles dans `.env` (jamais commitées)
- `SUPABASE_SERVICE_ROLE_KEY` uniquement côté backend
- RLS activé sur toutes les tables (policies à affiner avec Auth)
- CORS restreint au domaine frontend en production

## Déploiement (futur)

- **Frontend** : Vercel / Netlify
- **Backend** : Railway / Render / Fly.io
- **Database** : Supabase Cloud
