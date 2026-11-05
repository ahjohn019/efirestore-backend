# Efirestore Backend

NestJS backend for the Efirestore project.

## Requirements

- Docker Desktop
- Git
- Node.js and npm if you want to run the npm helper scripts locally

## Environment Setup

Create a `.env` file in the project root.

You can start from [`.env.example`](./.env.example) and fill in the missing values.

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

- [Dockerfile](./Dockerfile): app image
- [docker-compose.yml](./docker-compose.yml): base app + MySQL + Redis stack
- [docker-compose.local.yml](./docker-compose.local.yml): local development override with watch mode
- [docker/start.sh](./docker/start.sh): startup script used by the container

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
- `redis`: Redis for BullMQ background jobs

## Run And Test The EasyParcel Job Queue

The NestJS app runs both the API and the BullMQ worker. Redis holds the jobs; no separate worker command is needed.

### 1. Prepare the environment

Start Docker Desktop and wait until the Docker engine is ready. Create `.env` from `.env.example` if you have not already done so, then fill in the database settings and provider keys described above. Add:

```env
REDIS_HOST=redis
REDIS_PORT=6379
EASY_PARCEL_ENDPOINT=https://api.easyparcel.com/
EASY_PARCEL_ENVIRONMENT=demo
```

Compose uses `redis` as the Redis hostname. If running NestJS directly on Windows, use `REDIS_HOST=127.0.0.1` instead. Keep passwords containing `$` single-quoted in `.env` so Docker Compose does not interpret them as variable references.

### 2. Build and start the stack

Run from the project root:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Use `--build` to include the current source code and dependencies in the image, including the latest response helper changes.

For a new database, apply migrations before testing:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml exec app npm run migration:run
```

Check that `app` is running and both `mysql` and `redis` are healthy:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml ps
docker compose -f docker-compose.yml -f docker-compose.local.yml exec redis redis-cli ping
```

Redis should return `PONG`. If the API is not ready, inspect startup logs:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml logs --tail 100 app
```

### 3. Record the queue counts

These commands use the Windows `curl.exe` executable:

```powershell
curl.exe --max-time 10 -sS http://localhost/api/easyparcel/jobs/status
```

Example response:

```json
{"status":true,"data":{"waiting":0,"active":0,"completed":2,"failed":0,"delayed":0}}
```

Record the `completed` count. Existing counts may differ.

### 4. Submit a sample job

```powershell
curl.exe --max-time 10 -sS -X POST -w '\nHTTP %{http_code}\n' http://localhost/api/easyparcel/jobs/sample
```

Expected response with the latest source:

```json
{"status":"success","code":200,"data":true}
```

The HTTP status is `201`; the response body's `code: 200` comes from `createSuccessResponse`. A response of `{"status":true}` indicates an older build; rebuild the app with Step 2.

The sample job tests the queue without calling EasyParcel or creating a shipment.

### 5. Confirm the worker completed the job

Run the status request again after a few seconds:

```powershell
curl.exe --max-time 10 -sS http://localhost/api/easyparcel/jobs/status
docker compose -f docker-compose.yml -f docker-compose.local.yml logs --since 5m app | Select-String 'EasyparcelProcessor'
```

The `completed` count should increase by one, and logs should contain matching job IDs:

```text
Job 3 (sample) started
Job 3 (sample) completed
```

For an otherwise idle queue, `waiting`, `active`, `failed`, and `delayed` should be `0` after completion. If the job remains waiting, check that the app worker is running and uses the same Redis connection. If it fails or is delayed, inspect the worker error logs.

Live verification on 5 November 2026: the sample endpoint returned HTTP 201, completed jobs increased from 2 to 3, and worker logs confirmed Job 3 started and completed. This verified API → Redis → worker processing. The running image at that time returned the older `{"status":true}` response.

### 6. Test a paid order separately

Use EasyParcel demo credentials and Stripe test mode. Configure a matching `easy_parcel_auth` record for `EASY_PARCEL_ENVIRONMENT=demo`, then:

1. Create a checkout through `POST /api/stripe/checkout` with a valid, non-empty `easyparcel_shipment` array. Use Swagger at `http://localhost/api` for the request schema.
2. Complete the Stripe test payment and ensure its signed webhook reaches `POST /api/stripe/webhook`. Stripe needs a reachable webhook URL or local forwarding.
3. Check logs for a `paid-order` job starting and completing.
4. Confirm the order has status `paid`, retains its shipment payload, and has one corresponding row in `shipments`.

Paid-order jobs use the ID `easyparcel-order-<orderId>`, with five attempts and exponential backoff starting at five seconds. The worker rejects missing orders, unpaid orders, and empty shipment payloads.

The sample test does not verify Stripe webhook delivery, EasyParcel credentials, or actual shipment creation. See [EasyParcel testing details](EASYPARCEL_TESTING.md) for credential fields and database queries.

### 7. Run automated workflow tests

With Node.js and npm installed:

```powershell
npm ci
npm test -- --runInBand modules/easyparcel/easyparcel-queue.service.spec.ts modules/easyparcel/easyparcel.processor.spec.ts modules/easyparcel/easyparcel.controller.spec.ts modules/payments/stripe/stripe.service.spec.ts
```

Last verified: 4 suites and 28 tests passed. These tests use mocks and do not require Redis or call Stripe or EasyParcel. The broader `easyparcel.service.spec.ts` suite has four known failures involving shipment response fixtures and tracking-log handling; it is separate from this passing queue workflow command.

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

Base Docker Compose and the local override disable automatic migrations and seeds:

- `DATABASE_RUN_MIGRATIONS=false`
- `DATABASE_RUN_SEEDS=false`

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
