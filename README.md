# Photographer CRM

CRM pour studio photo avec authentification, gestion des clients et paramètres.

## Requirements

- Node.js 20.19 or newer
- npm
- Docker with Docker Compose

## Local setup

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm start` serves the production build.
- `npm run lint` runs ESLint.
- `npm run typecheck` checks TypeScript.
- `npm run format` formats the project with Prettier.
- `npm run format:check` checks formatting.
- `npm run db:generate` generates the Prisma client.
- `npm run db:migrate` creates and applies development migrations after models are added.
- `npm run db:seed` inserts the idempotent test clients.
- `npm run db:studio` opens Prisma Studio.

## Database

PostgreSQL runs locally in Docker and persists data in the `postgres_data` volume.

Stop PostgreSQL with:

```bash
docker compose down
```

## Paramètres

Les administrateurs (`canManageUsers`) accèdent à `/parametres` pour gérer les facultés, packs, suppléments, photographes et monteurs. Chaque élément peut être ajouté, modifié ou désactivé.

La grille `FacultyPackRate` contient les montants complets solo et binôme pour chaque couple faculté/pack. Elle constitue la source des tarifs à utiliser pour la future saisie client ; les prix de référence des packs ne s’y ajoutent pas. Un couple absent doit être configuré avant utilisation. Les anciens champs de prix de `Faculty` sont conservés mais ne sont pas utilisés par cette grille.

Le seed initialise les deux catégories de facultés, les trois packs et les douze montants fournis, sans écraser les tarifs déjà enregistrés. Les sept suppléments sont initialisés actifs avec les prix fournis : Toge 400 DH, Perso toge 30 DH, Tableau 400 DH, Miroir 400 DH, Album 600 DH, Photobook 1 200 DH et Déco 1 200 DH. Les photographes et monteurs sont à renseigner dans l’interface.

Pour appliquer les migrations versionnées : `npx prisma migrate deploy`, puis `npm run db:seed`.

Chaque rubrique est accessible dans la barre latérale. Le formulaire Facultés gère uniquement le nom et le statut. Le formulaire Packs enregistre le nom, le statut et tous les tarifs par faculté en une transaction. La route historique `/parametres/tarifs` redirige vers Packs ; aucun écran tarifaire séparé n’est nécessaire. Le prix de référence historique des packs est conservé en base mais masqué dans les formulaires.

Les facultés se renseignent désormais directement dans chaque pack sous forme de lignes (nom, tarif solo, tarif binôme). La page Facultés redirige vers Packs. Ajouter, renommer ou retirer une ligne ne modifie que les associations du pack concerné ; les autres packs conservent leurs tarifs.
