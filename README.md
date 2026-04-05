# Efirestore Backend

NestJS backend for the Efirestore project.

## Requirements

- Docker Desktop
- Git
- Node.js and npm if you want to run the npm helper scripts locally

## Environment Setup

Create a `.env` file in the project root.

You can start from [`.env.example`](c:/laragon/www/efirestore-backend/.env.example) and fill in the missing values.

Example Docker-friendly `.env`:

```env
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=db_efirestore
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_TYPE=mysql
DATABASE_RUN_MIGRATIONS=false
APP_MODE=local
APP_URL=0.0.0.0
PORT=3000
JWT_SECRET_KEY=change-me
EMAIL_HOST=
EMAIL_USERNAME=
EMAIL_PASSWORD=
SESSION_KEY=change-me
JWT_DURATION=1h
STRIPE_PAYMENT_DEV_SECRET_KEY=
STRIPE_ENDPOINT_SECRET=
FRONT_ENDURL=http://localhost:3001/
```

Notes:

- `DATABASE_HOST=mysql` is required when the app connects to the MySQL container from Docker Compose.
- `APP_MODE=local` is for Docker local development with watch mode.
- `APP_URL=0.0.0.0` is correct for Docker containers.
- Fill in the rest of the app secrets and provider keys for your environment.

## Docker Files

- [Dockerfile](c:/laragon/www/efirestore-backend/Dockerfile): app image
- [docker-compose.yml](c:/laragon/www/efirestore-backend/docker-compose.yml): base app + MySQL stack
- [docker-compose.local.yml](c:/laragon/www/efirestore-backend/docker-compose.local.yml): local development override with watch mode
- [docker/start.sh](c:/laragon/www/efirestore-backend/docker/start.sh): startup script used by the container

## Start With Docker

Build and start the local development stack:

```bash
npm run docker:dev:build
```

Or with raw Docker Compose:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

This starts:

- `app`: NestJS backend
- `mysql`: MySQL 8 database

## Local Watch Mode

For local development, run the app container and watch mode in separate terminals.

Terminal 1:

```bash
npm run docker:dev
```

Terminal 2:

```bash
npm run docker:watch
```

Equivalent raw commands:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up
docker compose -f docker-compose.yml -f docker-compose.local.yml watch
```

This setup is intended for `APP_MODE=local`.

When you change files in `src/` or `public/`, Docker Compose watch syncs the changes and restarts the app container.

## Endpoints

Default local endpoints:

- App: `http://localhost`
- Swagger: `http://localhost/api`

If you add a hosts alias like this:

```txt
127.0.0.1 efirestore-backend
```

Then you can use:

- App: `http://efirestore-backend`
- Swagger: `http://efirestore-backend/api`

## Database Migrations And Seeds

Base Docker Compose enables:

- `DATABASE_RUN_MIGRATIONS=true`
- `DATABASE_RUN_SEEDS=true`

Local override disables both during watch-mode development:

- `DATABASE_RUN_MIGRATIONS=false`
- `DATABASE_RUN_SEEDS=false`

Manual commands inside Docker:

Run migration:

```bash
docker compose exec app npm run migration:run
```

Revert last migration:

```bash
docker compose exec app npm run migration:revert
```

Run seeds:

```bash
docker compose exec app npm run seed:run
```

## Useful Commands

Start local dev:

```bash
npm run docker:dev
```

Rebuild local dev stack:

```bash
npm run docker:dev:build
```

Run watch:

```bash
npm run docker:watch
```

Stop containers:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

View app logs:

```bash
docker compose logs -f app
```

View MySQL logs:

```bash
docker compose logs -f mysql
```

## Troubleshooting

If the app cannot connect to MySQL:

- make sure `.env` uses `DATABASE_HOST=mysql`
- restart with:

```bash
docker compose down -v
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

If file changes are not reflected during local development:

- make sure `APP_MODE=local`
- keep both `npm run docker:dev` and `npm run docker:watch` running
- check app logs with:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f app
```

If dependencies or Docker config change, rebuild the stack:

```bash
npm run docker:dev:build
```
