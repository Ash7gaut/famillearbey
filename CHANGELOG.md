# Changelog

## [Non publié] — worktree-arbre-genealogique

### Modifié
- Arbre généalogique : refonte complète en une vue unique codée maison (React + SVG) : layout par générations (couples, remariages, racines multiples), cartes photo aux tokens de l'app (dark mode inclus), connecteurs orthogonaux arrondis, pan/zoom maison (pointer events, molette, pinch), recherche de membre, sélecteur de racine (mamie par défaut). Store `familyStore` : `fetchTreeData` (`/members` + `/relationships`) remplace `fetchTree`. Mobile : zoom de départ lisible (0,85) centré sur la racine quand l'arbre ne tient pas, texte des cartes agrandi, hauteur du canvas compensant la nav mobile, contraste dark des défunts et connecteurs renforcé.

### Supprimé
- Page « Famille » (`/famille`, `FamilyDirectoryPage`, `FamilyRelationsCard`), son entrée de navigation, le raccourci « Voir toute la famille » du profil et l'endpoint `GET /members/directory`.
- Les 3 anciennes vues (FamilyTree JS / BALKAN, vue détaillée, family-chart), leur CSS (`index.css`) et les dépendances `@balkangraph/familytree.js`, `family-chart`, `react-zoom-pan-pinch`.

## [Non publié] — feature/chat

### Ajouté
- Messagerie de groupe : migration `011_messaging.sql`, routes `/conversations`, pages `MessagingPage` et `ConversationPage`, store `messagingStore`.
- Notifications push : routes `/push`, `pushService` (`web-push`), hook `usePushNotifications`, service worker `sw.ts` (`vite-plugin-pwa` en `injectManifest`).
- Variables d'env backend `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- Serveur MCP Supabase du projet (`.mcp.json`).
- Agents `git-supabase`, `tester`, `damien`, `supabase-expert` (`.claude/agents/`).
- `CLAUDE.md`, `ROADMAP.md`, `CHANGELOG.md`.
- Attributs `data-testid` (convention kebab-case `<zone>-<élément>[-<id>]`, documentée dans `CLAUDE.md`) sur toutes les pages et composants interactifs du frontend, et prop `data-testid` sur les composants UI réutilisables, pour les tests Playwright.

### Modifié
- La vue « Accueil » (`/accueil`, `HomePage`) est supprimée : « Messages » (`/messagerie`) devient la vue principale (premier item de navigation desktop et mobile, logos, redirection après connexion, `start_url` de la PWA, liens de retour des pages).

### Dev local (Realtime)
- `docker-compose.dev.yml` désormais versionné (retiré du `.gitignore`) ; lockfiles `backend/` et `frontend/` resynchronisés avec `package.json` (`web-push`, `vite-plugin-pwa`, `workbox-precaching`) pour que `npm ci` passe.
- `docker/init/00-roles.sql` : `supabase_realtime_admin` SUPERUSER (dev uniquement, requis pour les migrations internes de Realtime avec l'image postgres standard).
- `docker/Dockerfile.db.dev` : postgres:15 + `wal2json` ; le service `db` du compose dev l'utilise et autorise le plugin via `output_plugin_libraries` (necessaire pour postgres_changes).
- Correctif : la modale "Nouveau groupe" n'est plus demontee par le spinner de `MessagingPage` lors d'un refetch (test e2e flaky).

## Précédemment

- Nouveau logo (2026-07-13)
- Bouton PWA, PWA, tribu, dark mode (2026-07-12)
