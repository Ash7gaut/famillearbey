# Famille Arbey

Plateforme familiale privée (arbre généalogique, posts, albums, événements, souvenirs, Secret Santa, messagerie). React + Vite + TS + Tailwind + Zustand / Node + Express / Supabase.

## Workflow git

- Jamais de code poussé directement sur `main` : on travaille toujours dans une branche de travail.
- Après validation explicite de l'utilisateur, on peut merger (squash) la branche de travail dans `main` et pousser `main`.
- Sans validation, on s'arrête à la branche.
- Zéro branche ni worktree fantôme : une branche de travail mergée dans `main` est supprimée tout de suite (locale et distante), de même pour les worktrees (`git worktree remove`) et les branches temporaires créées par les agents/sessions. Quand tout le travail est fini (toutes sessions et tous agents), il ne doit rester que `main`, à jour (`git fetch --prune`, `git worktree prune`, `git branch -a` pour vérifier).

## Agents (`.claude/agents/`)

- `git-supabase` (Haiku) : git et MCP Supabase.
- `tester` (Haiku) : tests Playwright courts et rapides, via Docker.
- `damien` (Sonnet) : ingénieur logiciel sénior.
- `supabase-expert` (Sonnet) : performance et coûts Supabase.

## Rôle de la session principale : coordinateur

Quand l'utilisateur demande quelque chose, la session principale ne fait pas le travail elle-même : elle délègue au maximum aux bons agents et se limite à coordonner (cadrer la demande, découper, lancer les agents, relayer leurs résultats, synthétiser, demander les validations).

- Code, refactor, revue → `damien`.
- Git, MCP Supabase → `git-supabase`.
- Tests Playwright / lancement des tests → `tester`.
- Audit base, perf, coûts → `supabase-expert`.
- La session principale ne code, ne teste et ne touche à git elle-même que pour une micro-tâche triviale (lecture rapide, édition d'une ligne).
- Si un agent du projet n'est pas chargé dans la session (les agents sont lus au démarrage), le remplacer par un agent générique avec le même modèle et les mêmes consignes, et le signaler.
- Chaque agent reçoit un brief complet (contexte, fichiers, contraintes, format de rapport attendu) ; plusieurs agents indépendants se lancent en parallèle.

## Conventions

- Tests e2e Playwright dans `e2e/` : versionnés et commités, jamais réécrits de zéro (on étend l'existant). Sélecteurs via `data-testid`.
- `data-testid` en kebab-case, forme `<zone>-<élément>` : `login-email-input`, `messaging-new-group-button`, `conversation-message-input`, `conversation-send-button`, `nav-messages-link`.
- Éléments répétés : `<zone>-<élément>-<id métier>` (`conversation-item-${c.id}`, `message-${m.id}`, `member-option-${m.id}`) + un testid de conteneur de liste (`conversation-list`, `message-list`). Jamais d'index ni de texte affiché dans un testid.
- États et modales aussi : spinner (`*-loading-spinner`), erreur (`*-error`), vide (`*-empty`), badge non-lu (`conversation-unread-badge-${id}`), modale (`*-modal` + boutons `*-close-button` / `*-submit-button`).
- Composants UI réutilisables (`LoadingSpinner`, `BackLink`, `MemberAvatar`, `MemberSelect`, `RelationGroup`) acceptent une prop `data-testid` (valeur par défaut générique) ; `UserMenu` préfixe par variante (`user-menu-sidebar-*`, `user-menu-header-*`) car plusieurs instances coexistent dans le DOM.
- Aucun runtime local : build, tests et lint via Docker (`docker-compose.dev.yml`).
- Mettre à jour `README.md`, `ROADMAP.md`, `CHANGELOG.md` avec le code.
- "Utilisateur" = utilisateur connecté.
