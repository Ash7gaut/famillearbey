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

## Modèle de données

### Schéma de la base (tables & relations)

Toutes les tables métier pointent vers `family_members` (le membre est l'entité
centrale). `auth.users` est géré par Supabase Auth (GoTrue) ; un membre y est relié
via `auth_user_id`.

```mermaid
erDiagram
    auth_users ||--o| family_members : "auth_user_id (lien compte)"

    family_members ||--o{ relationships : "member_id"
    family_members ||--o{ relationships : "related_member_id"

    family_members ||--o{ posts : "author_id"
    family_members ||--o{ comments : "author_id"
    posts          ||--o{ comments : "post_id"
    photos         ||--o{ comments : "photo_id"

    family_members ||--o{ albums : "created_by"
    albums         ||--o{ photos : "album_id"
    family_members ||--o{ photos : "uploaded_by"
    photos         ||--o{ photo_likes : "photo_id"
    family_members ||--o{ photo_likes : "member_id"

    family_members ||--o{ events : "created_by"
    events         ||--o{ rsvps : "event_id"
    family_members ||--o{ rsvps : "member_id"

    family_members ||--o{ memories : "author_id"

    secret_santa_rounds       ||--o{ secret_santa_exclusions : "round_id"
    secret_santa_rounds       ||--o{ secret_santa_pairs : "round_id"
    family_members            ||--o{ secret_santa_exclusions : "member_id / excluded_member_id"
    family_members            ||--o{ secret_santa_pairs : "giver_id / receiver_id"
    secret_santa_groups       ||--o{ secret_santa_participants : "group_id"
    family_members            ||--o{ secret_santa_participants : "member_id (ou invité externe)"

    family_members ||--o{ access_requests : "email d'accès"

    family_members {
        uuid id PK
        uuid auth_user_id FK "→ auth.users, nullable"
        text first_name
        text last_name "défaut 'Arbey'"
        text invite_email "lien avant 1re connexion"
        bool is_admin
        bool is_alive
        date birth_date
        date death_date
    }

    relationships {
        uuid id PK
        uuid member_id FK "→ family_members"
        uuid related_member_id FK "→ family_members"
        enum relationship_type "parent | spouse | sibling"
    }
```

> `relationships` est la seule table qui relie des membres **entre eux** : c'est elle
> qui porte tout l'arbre généalogique (voir ci-dessous). Les autres tables ne font que
> rattacher du contenu (posts, photos, événements…) à un membre.

### Comment sont enregistrés les liens de parenté

Point important : la base ne stocke **que 3 types de liens** (enum `relationship_type`) :
`parent`, `spouse`, `sibling`. Tous les autres liens (père, mère, enfant, grand-parent,
cousin…) sont soit **une lecture directionnelle** de ces 3 types, soit **non stockés du
tout** et déduits (ou pas) à l'affichage.

Chaque ligne de `relationships` a deux colonnes : `member_id` et `related_member_id`.
Le sens de lecture dépend du type :

```mermaid
flowchart TD
    subgraph stored["Ce qui est STOCKÉ dans relationships (3 types)"]
        direction TB
        P["<b>parent</b> — DIRECTIONNEL<br/>member_id = le parent<br/>related_member_id = l'enfant"]
        S["<b>spouse</b> — SYMÉTRIQUE<br/>member_id ↔ related_member_id<br/>(conjoint, lu dans les 2 sens)"]
        F["<b>sibling</b> — SYMÉTRIQUE<br/>member_id ↔ related_member_id<br/>(frère / sœur, lu dans les 2 sens)"]
    end

    subgraph derived["Ce qui est DÉDUIT à la lecture (non stocké tel quel)"]
        direction TB
        PERE["<b>Père / Mère</b><br/>= lignes 'parent' où je suis l'enfant<br/>(related_member_id = moi)"]
        ENF["<b>Enfants</b><br/>= lignes 'parent' où je suis le parent<br/>(member_id = moi)"]
        FRERE["<b>Frères / Sœurs</b><br/>= lignes 'sibling' me concernant"]
        CONJ["<b>Conjoint(e)s</b><br/>= lignes 'spouse' me concernant"]
    end

    subgraph notmodeled["NON modélisé"]
        COUSIN["<b>Cousins, oncles, grands-parents…</b><br/>aucun lien dédié en base.<br/>« cousins » n'apparaît que dans les textes de l'UI ;<br/>il n'est ni stocké ni calculé."]
    end

    P --> PERE
    P --> ENF
    F --> FRERE
    S --> CONJ

    style stored fill:#e8f5e9,stroke:#43a047
    style derived fill:#e3f2fd,stroke:#1e88e5
    style notmodeled fill:#fdecea,stroke:#e53935
```

**Détails de la dérivation** (implémentée côté backend, `familyMemberService` /
`relationshipService`) :

| Lien affiché      | Comment il est obtenu                                                                 |
|-------------------|----------------------------------------------------------------------------------------|
| **Père / Mère**   | lignes `parent` où `related_member_id = moi` → `member_id` est un parent               |
| **Enfants**       | lignes `parent` où `member_id = moi` → `related_member_id` est un enfant                |
| **Frères / Sœurs**| lignes `sibling` où je suis l'un des deux membres (symétrique)                          |
| **Conjoint(e)s**  | lignes `spouse` où je suis l'un des deux membres (symétrique)                           |
| **Cousins**       | ❌ non stocké, non calculé — terme purement éditorial dans l'interface                  |

> ⚠️ **Il n'y a pas de notion de genre** dans `family_members` : « père » et « mère »
> ne sont pas distingués en base, ce sont tous deux des liens `parent`. L'UI affiche
> donc un groupe « Parents » générique, pas « Père » / « Mère » séparément.
>
> L'arbre complet (`GET /api/v1/relationships/tree`) est reconstruit en mémoire à partir
> de ces lignes : on part des membres sans parent (les racines), puis on descend via les
> liens `parent`, en rattachant les `spouse` à chaque nœud.

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

### Messagerie et notifications push (branche `feature/chat`)

Toutes les routes exigent d'être connecté. Migration : `supabase/migrations/011_messaging.sql`.

| Méthode | Endpoint                                  | Description                                  |
|---------|-------------------------------------------|----------------------------------------------|
| GET     | `/api/v1/conversations`                   | Mes conversations                            |
| POST    | `/api/v1/conversations`                   | Créer une conversation (admin)               |
| GET     | `/api/v1/conversations/:id/messages`      | Messages                                     |
| POST    | `/api/v1/conversations/:id/messages`      | Envoyer un message                           |
| PUT     | `/api/v1/conversations/:id/members/:mid`  | Ajouter un membre                            |
| DELETE  | `/api/v1/conversations/:id/members/:mid`  | Retirer un membre                            |
| PATCH   | `/api/v1/conversations/:id/muted`         | Couper / réactiver les notifications         |
| POST    | `/api/v1/conversations/:id/read`          | Marquer comme lu                             |
| GET     | `/api/v1/push/public-key`                 | Clé publique VAPID                           |
| POST    | `/api/v1/push/subscribe`                  | Abonner l'appareil aux notifications push    |
| POST    | `/api/v1/push/unsubscribe`                | Désabonner l'appareil                        |

Variables d'environnement backend : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

## Roadmap

Voir [ROADMAP.md](ROADMAP.md) et [CHANGELOG.md](CHANGELOG.md).

# famillearbey
