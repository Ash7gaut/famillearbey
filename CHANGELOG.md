## [Non publié] — feat/groupes-whatsapp

### Ajouté
- Page « Groupes » (`/groupes`, `GroupsPage`) : annuaire des groupes WhatsApp de la famille (image ou initiales, description, « N membres de l'arbre y sont », « Rejoindre », « J'y suis déjà » / « Vous y êtes », « Le lien ne marche plus ? », groupe épinglé). C'est la vue principale (navigation, redirections, `start_url` PWA).
- Création / modification : nom, image, description, lien d'invitation (doit commencer par `https://chat.whatsapp.com/`), accès. Accès « Toute la famille » ou « Accès limité » (sélecteur `GroupAccessPicker` : puces des personnes, tribus en un tap qui copient leurs membres, recherche de personnes, « Annuler »).
- Tuto « Comment obtenir le lien d'invitation ? » (`GroupHelpModal`, étapes valables sur iPhone et Android, réinitialisation du lien).
- Backend `/whatsapp-groups` (`whatsappGroupService`) : le lien n'est jamais renvoyé sans accès (404), tout membre ayant accès modifie la fiche, ajoute ET retire des personnes et change le mode d'accès (le créateur garde toujours accès) ; épinglage et suppression réservés au créateur/admin ; un admin voit et modifie tous les groupes, y compris à accès limité.
- Migration `016_whatsapp_groups.sql` (groupes, accès, présences, signalements).
- Tests e2e `groupes-whatsapp.spec.ts`.

### Supprimé
- Messagerie (pages, store, composants, routes `/conversations`, tests e2e) et notifications push (routes `/push`, `web-push`, hook, bouton du menu, gestionnaires du service worker, variables `VAPID_*`).
- Migration `017_remove_messaging.sql` : tables `conversations`, `conversation_members`, `messages`, `push_subscriptions` et fonctions associées (à appliquer séparément).
- `/messagerie` redirige vers `/groupes`.
- Service `realtime` du `docker-compose.dev.yml` (et sa route Kong), plus utilisé par l'appli.

### Modifié
- Tuto du lien d'invitation aligné sur les pages d'aide officielles de WhatsApp (libellés confirmés uniquement, le reste reste générique).
# Changelog

## [Non publié] — feat/secret-santa-wishlist

### Ajouté
- Secret Santa : liste de souhaits par participant (membres et invités externes), modifiable avant ou après le tirage (max 20 idées : titre, lien https, image, prix, précision). Composants `WishlistEditor`, `WishlistItemCard`, `ReceiverWishlist`.
- Aperçu de lien (titre + image) appelé depuis le navigateur via Microlink (`lib/linkPreview.ts`), copié dans l'idée à l'enregistrement ; repli de saisie manuelle si l'aperçu échoue (Amazon, Cdiscount…). L'URL collée est envoyée à Microlink.
- Le tireur voit la liste de son tiré (après tirage) et coche « Je prends ça » ; les cases sont dans une table séparée, le tiré ne les voit jamais et la liste du tiré est résolue côté serveur (aucun identifiant de pair exposé).
- Backend : routes `/secret-santa/:id/wishlist`, `/:id/receiver-wishlist[/:itemId/pick]` et équivalents `/secret-santa/invite/:token/...` pour les invités ; validation (https uniquement, titre 120, précision 300, prix 40).
- Migration `015_secret_santa_wishlist.sql` (tables `secret_santa_wishlist_items`, `secret_santa_wishlist_picks`, RLS sans policy ; ajoute aussi `revealed_at` s'il manque). À appliquer sur Supabase.

### Corrigé
- Mobile : la modale « Ajouter/Modifier une idée » passe au-dessus de la barre de navigation (portail `body` + `z-[100]`), défile en interne (`max-h` en `dvh`), verrouille le scroll de la page et garde le bouton de validation collé en bas. Test e2e mobile 390x844 et 360x640.
- Outillage : ajout de `.gitattributes` (`*.sh text eol=lf`) ; `docker/apply-migrations.sh` n'est plus extrait en CRLF sous Windows (erreur `set: Illegal option -` du service `migrate`).

### Supprimé
- Secret Santa : lien « Voir le profil » retiré partout (panneau « Qui joue avec toi », liste des participants au tirage) ; les cartes ne sont plus cliquables.
## [Non publié] — feat/profile-vcard

### Ajouté
- Bouton « Ajouter aux contacts » (`profile-add-contact-button`) sur le profil d'un autre membre vivant : ouvre une vCard 3.0 (N/FN, TEL, EMAIL, BDAY, PHOTO, CATEGORIES, NOTE) dans l'appli Contacts du téléphone ou la télécharge sur desktop.
- Backend : `POST /members/:id/vcard-link` (authentifié, renvoie une URL signée HMAC-SHA256 valable 2 min) et `GET /members/:id/vcard?exp=&sig=` (publique, 403 si signature invalide ou expirée, 404 si membre inconnu). Utilitaires `utils/vcard.ts` (échappement, pliage 75 octets, CRLF) et `utils/signedLink.ts`.
- Email : celui du compte (auth) à défaut `invite_email` ; photo récupérée côté serveur (timeout 3 s, ignorée si non JPEG/PNG ou > 1 Mo) ; anniversaire sans année si `birth_date_display = 'day_month'`.

## [Non publié] — fix/secret-santa-ui

### Corrigé
- Secret Santa : les champs de saisie (nouveau tirage : titre et budget ; invitation d'un invité externe) utilisent la classe `input-field` du thème (fond, texte, bordure, placeholder et focus cohérents en mode sombre ; le texte n'était plus lisible sur fond blanc).
- Secret Santa : variantes mode sombre pour les éléments rouges (badge « Décliné », erreur du formulaire, bouton « Supprimer », bouton « Retirer », bordure de la carte Paramètres).

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
