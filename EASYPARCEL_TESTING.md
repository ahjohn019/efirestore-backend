# EasyParcel Background Order Testing

## Quick test steps

| Step | Action | Command or expected result |
|---:|---|---|
| 1 | Run the automated tests. These do not call Redis, Stripe, MySQL, or EasyParcel. | See the test command below. |
| 2 | Add the Redis and EasyParcel settings to `.env`. | See the environment table below. |
| 3 | Add EasyParcel demo credentials to the `easy_parcel_auth` table. | Use demo credentials only. Do not commit tokens. |
| 4 | Run the database migrations. | See the migration command below. |
| 5 | Start the Docker services. | `npm run docker:dev:build` |
| 6 | Send a sample queue job. | Call `POST /api/easyparcel/jobs/sample`. |
| 7 | Check the queue status. | Call `GET /api/easyparcel/jobs/status`. |
| 8 | Create and pay for a Stripe test checkout containing `easyparcel_shipment`. | Stripe's webhook should enqueue the paid order automatically. |
| 9 | Check the application logs. | Look for a completed `paid-order` job. |
| 10 | Check the database. | Confirm one shipment exists for the paid order. |

## Step 1: Automated tests

| Item | Value |
|---|---|
| Command | `npm test -- --runInBand modules/easyparcel/easyparcel-queue.service.spec.ts modules/easyparcel/easyparcel.processor.spec.ts modules/payments/stripe/stripe.service.spec.ts` |
| Expected suites | `3 passed` |
| Expected tests | `20 passed` |
| Verified | 30 September 2026 |

These tests confirm that a paid order is queued and that the worker passes the
stored shipment payload to `submitOrder`.

## Step 2: Environment settings

| Variable | Docker value | Local NestJS value |
|---|---|---|
| `REDIS_HOST` | `redis` | `127.0.0.1` |
| `REDIS_PORT` | `6379` | `6379` |
| `EASY_PARCEL_ENDPOINT` | `https://api.easyparcel.com/` | `https://api.easyparcel.com/` |
| `EASY_PARCEL_ENVIRONMENT` | `demo` | `demo` |

Add the appropriate values to `.env`.

## Step 3: EasyParcel demo credentials

| Database field | Value |
|---|---|
| `auth_token` | EasyParcel demo access token |
| `auth_key` | EasyParcel demo auth key |
| `refresh_token` | EasyParcel demo refresh token |
| `redirect_url` | Registered redirect URL |
| `endpoint` | `https://api.easyparcel.com/` |
| `version` | Open API version enabled for the account, including the final `/` |
| `type` | `demo` |

The `type` value must match `EASY_PARCEL_ENVIRONMENT`.

## Step 4: Start the application

| Action | Command |
|---|---|
| Run migrations | `docker compose -f docker-compose.yml -f docker-compose.local.yml run --rm app npm run migration:run` |
| Start the stack | `npm run docker:dev:build` |
| Watch application logs | `docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f app` |

The local API base URL is `http://localhost/api`.

## Step 5: Test Redis and the worker

| Action | PowerShell command | Expected result |
|---|---|---|
| Add a sample job | `Invoke-RestMethod -Method Post -Uri 'http://localhost/api/easyparcel/jobs/sample'` | `{"status":true}` |
| Check the queue | `Invoke-RestMethod -Method Get -Uri 'http://localhost/api/easyparcel/jobs/status'` | The `completed` count increases. |
| Check logs | Use the log command from Step 4. | The sample job is logged as started and completed. |

The sample job tests Redis and BullMQ only. It does not contact EasyParcel.

## Step 6: Test a paid order

| Step | Action | Expected result |
|---:|---|---|
| 1 | Create a checkout using `POST /api/stripe/checkout`. Include a valid `easyparcel_shipment` array. | The order stores the shipment payload. |
| 2 | Complete payment using Stripe test mode. | Stripe sends a signed webhook. |
| 3 | Let Stripe call `POST /api/stripe/webhook`. | A `paid-order` job is added automatically. |
| 4 | Watch the application logs. | The job is logged as started and completed. |
| 5 | Check `orders`. | The order status is `paid` and `easyparcel_shipment` is not empty. |
| 6 | Check `shipments`. | Exactly one row exists for the order ID. |

## Database checks

| Check | SQL |
|---|---|
| Latest orders | `SELECT id, status, checkout_stripe_id, easyparcel_shipment FROM orders ORDER BY id DESC LIMIT 5;` |
| Latest shipments | `SELECT id, order_id, courier, tracking_number, shipment_status, raw_data FROM shipments ORDER BY id DESC LIMIT 5;` |

## Success checklist

| Check | Expected value |
|---|---|
| Order status | `paid` |
| Stored payload | `easyparcel_shipment` is a non-empty array |
| Queue job | `paid-order` completes |
| Shipment record | One row exists for the order ID |
| Duplicate protection | Reprocessing does not create a second shipment |

## Common failures

| Problem | What to check |
|---|---|
| Redis connection fails | Confirm `REDIS_HOST` is `redis` in Docker or `127.0.0.1` locally. |
| Authentication record not found | Confirm `easy_parcel_auth.type` matches `EASY_PARCEL_ENVIRONMENT`. |
| Worker says the order is not paid | Confirm `orders.status` is exactly `paid`. |
| Worker says shipment details are missing | Confirm `orders.easyparcel_shipment` contains a non-empty array. |
| EasyParcel rejects the order | Check the token, API version, `service_id`, addresses, dimensions, and collection date. |
| Job is not completed | Check the `failed` and `delayed` queue counts and application logs. |

## Request-free status

| Question | Current status |
|---|---|
| Does the browser need to call EasyParcel directly? | No. The background worker calls EasyParcel. |
| What currently starts the job? | A Stripe webhook or `/api/stripe/checkout/update`. |
| Can a scheduled task submit paid orders without an incoming request? | Not yet. The current Stripe cron updates order status but does not enqueue EasyParcel jobs. |
| What must be added? | A scheduled task that finds paid orders with a payload and no shipment, then calls `enqueuePaidOrder(order.id)`. |
