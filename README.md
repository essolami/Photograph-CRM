# Photographer CRM

Clean application foundation for a professional photographer CRM. No CRM features, authentication, data models, or seed data are included yet.

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
