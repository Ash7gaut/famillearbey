# Changelog

## [Non publié] — feat/phone-input-fr

### Ajouté
- Composant `PhoneInput` (`components/ui/`) : préfixe fixe « 🇫🇷 +33 », saisie du numéro national formatée par paires (« 6 12 34 56 78 »), accepte « 06… », « 6… », « +33 6… », chiffres uniquement, état valide/erreur, `inputMode="tel"`, dark mode. Émet du E.164 (`+33612345678`). Utilisé dans le profil et le formulaire admin (testids `profile-phone-input`, `member-form-phone-input` conservés ; suffixes `-prefix`, `-valid`, `-error`, `-wrapper`).
- Helpers `parseFrenchNational`, `isValidFrenchPhone`, `formatPhoneDisplay`, `phoneHref` (`memberUtils.ts`) : affichage « +33 6 12 34 56 78 » avec lien `tel:+33…` sur le profil, la fiche arbre et la liste admin ; un numéro historique non convertible est affiché tel quel.

### Modifié
- Backend `normalizePhone` : seuls les numéros français sont acceptés (+33 ou 0 national, 9 chiffres, 01-07 et 09, 08 refusé), stockés en E.164 `+33XXXXXXXXX` ; sinon 400 `VALIDATION_ERROR`.

## [Non publié] — feat/pwa-install-visuels

### Ajouté
- Manifest PWA : `description` enrichie et `screenshots` (`frontend/public/screenshots/` : `messages|arbre|albums|evenements-narrow.png` 390x844, `messages|arbre-wide.png` 1280x800) pour l'interface d'installation enrichie d'Android/Chrome/Edge. Non précachées (le précache du SW ne couvre que js/css/html).
- Modale d'installation iOS : étapes numérotées avec illustrations SVG inline du bouton Partager puis de « Sur l'écran d'accueil » (`install-prompt-ios-step-share`, `install-prompt-ios-step-add`).
## [Non publié] — feat/member-phone

### Ajouté
- Numéro de téléphone du membre (`family_members.phone`, migration 014) : saisie sur son propre profil et dans le formulaire admin, affichage sur le profil (lien `tel:`), la fiche membre de l'arbre et la liste admin. Validation légère côté backend (6 à 15 chiffres, `+ . - ( )` et espaces admis), vide => `null`. Mêmes permissions que `birth_date` (profil : soi-même ; admin : tous).

## [Non publié] — feat/modal-installation-pwa

### Ajouté
- Modale « Installe l'appli ! » à chaque visite pour l'utilisateur connecté (auth résolue) hors PWA installée : bouton Installer (Chrome/Edge/Android, via `beforeinstallprompt`) ou instructions Partager > « Sur l'écran d'accueil » (iOS). Fermeture valable pour la session seulement, aucune mémorisation. Affichée uniquement sur mobile/tablette (détection d'appareil : `pointer: coarse`, userAgent Android/iPhone/iPad, iPadOS en mode Mac avec `maxTouchPoints > 1`), jamais sur ordinateur ; le bouton « Installer l'app » du UserMenu reste inchangé. Masquée sur les navigateurs mobiles sans installation (ex. Firefox Android).

### Modifié
- `useInstallPrompt` : `beforeinstallprompt` / `appinstalled` captés au niveau module (dès `main.tsx`) ; expose `canInstall`, `isStandalone`, `isIOS`, `isMobileDevice`, `install()` (API de `UserMenu` conservée).

## [Non publié] — feat/config-groupe-messagerie

### Ajouté
- Paramètres du groupe de messagerie : modale `GroupSettingsModal` (bouton `conversation-settings-button`) pour renommer, changer l'image, éditer la description et ajouter des membres ; routes `PATCH /conversations/:id` et `POST /conversations/:id/image` (tout membre du groupe, contrôlé côté backend).
- Migration `013_conversation_settings.sql` : colonnes `image_url` et `description`, `search_path` figé sur `bump_conversation`, `DELETE` révoqué sur `conversation_members` + trigger bloquant les suppressions directes (cascades autorisées).
- Image du groupe affichée dans la liste des conversations.
- Tests e2e : paramètres du groupe (UI) et droits/non-retrait (API).

### Supprimé
- Retrait de membre et « Quitter le groupe » : route `DELETE /conversations/:id/members/:mid`, `removeMember` (service, store) et boutons associés.

## [Non publié] — worktree-arbre-genealogique

### Modifié
- Arbre généalogique : refonte complète en une vue unique codée maison (React + SVG) : layout par générations (couples, remariages, racines multiples), cartes photo aux tokens de l'app (dark mode inclus), connecteurs orthogonaux arrondis, pan/zoom maison (pointer events, molette, pinch), recherche de membre, sélecteur de racine (mamie par défaut). Store `familyStore` : `fetchTreeData` (`/members` + `/relationships`) remplace `fetchTree`. Mobile : zoom de départ lisible (0,85) centré sur la racine quand l'arbre ne tient pas, texte des cartes agrandi, hauteur du canvas compensant la nav mobile, contraste dark des défunts et connecteurs renforcé.

### Supprimé
- Calendrier : bouton « + Nouvel événement » de l'en-tête (doublon de « Événement ce jour » et des « + » par case, qui gardent le formulaire).
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
