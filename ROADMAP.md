# Roadmap

## Fait

- [x] Architecture + schéma DB
- [x] MVP : arbre généalogique + albums photos
- [x] Dark mode
- [x] Tribu
- [x] PWA (installable, bouton d'installation)
- [x] Nouveau logo
- [x] Refonte de l'arbre généalogique (vue unique maison, sans BALKAN ni family-chart)

## En cours (`feature/chat`)

- [ ] Messagerie de groupe (conversations, membres, messages, muet, lu/non lu)
- [ ] Notifications push (Web Push / VAPID, service worker `sw.ts`)
- [ ] Appliquer la migration `011_messaging.sql` sur Supabase
- [ ] Générer les clés VAPID et les renseigner dans l'env
- [ ] Tests Playwright de la messagerie
- [ ] Tests Playwright de l'arbre (`e2e/arbre.spec.ts`)

## À venir

- [ ] Mur familial
- [ ] Événements + RSVP
- [ ] Secret Santa
- [ ] Mémoire familiale
- [ ] Family Arbey Wrapped
- [ ] Audit performance / coûts Supabase
