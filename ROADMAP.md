# Roadmap

## Fait

- [x] Architecture + schéma DB
- [x] MVP : arbre généalogique + albums photos
- [x] Dark mode
- [x] Tribu
- [x] PWA (installable, bouton d'installation)
- [x] Nouveau logo
- [x] Modale d'invitation à installer la PWA (mobile/tablette uniquement, à chaque visite, hors PWA installée)
- [x] Visuels d'installation PWA (captures du manifest pour Android/Chrome/Edge, étapes illustrées iOS)
- [x] Refonte de l'arbre généalogique (vue unique maison, sans BALKAN ni family-chart)
- [x] Retrait de la page Famille (l'arbre et les profils couvrent le besoin)
- [x] Numéro de téléphone du membre (profil, fiche membre, admin)
- [x] Téléphone : numéros français uniquement (+33), saisie `PhoneInput` formatée, stockage E.164
- [x] Bouton « Ajouter aux contacts » sur le profil d'un membre (vCard servie par le backend via lien signé)
- [x] Secret Santa : listes de souhaits (aperçu de lien Microlink côté navigateur, cases « Je prends ça » invisibles du tiré), retrait de « Voir le profil »
- [x] Appliquer la migration `015_secret_santa_wishlist.sql` sur Supabase

## En cours (`feat/groupes-whatsapp`)

- [x] Retrait de la Messagerie et des notifications push (pages, routes, store, tests, tables)
- [x] Groupes WhatsApp : annuaire, lien d'invitation, « Rejoindre », « J'y suis déjà », signalement de lien cassé, accès (famille / limité par personne ou par tribu), tuto « Comment obtenir le lien ? »
- [x] Tests Playwright des groupes (`e2e/groupes-whatsapp.spec.ts`)
- [ ] Appliquer `016_whatsapp_groups.sql` puis `017_remove_messaging.sql` sur Supabase
- [ ] Tests Playwright de l'arbre (`e2e/arbre.spec.ts`)

## À venir

- [ ] Mur familial
- [ ] Événements + RSVP
- [ ] Mémoire familiale
- [ ] Family Arbey Wrapped
- [ ] Audit performance / coûts Supabase
