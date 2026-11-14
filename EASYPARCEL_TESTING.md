# Test EasyParcel order synchronization

1. Configure `EASY_PARCEL_ENDPOINT` and `EASY_PARCEL_ENVIRONMENT=demo` in `.env`,
   together with the database and Stripe test settings. Configure a matching
   `easy_parcel_auth` record for the demo environment.
2. Start the backend and database. Apply migrations for a new database.
3. Create and pay for a Stripe test checkout. Ensure the signed Stripe webhook
   reaches the backend and the order has status `paid`.
4. Ensure the order has valid items, an active user shipping address, and the
   EasyParcel service details required by the order payload builder.
5. As an authenticated admin, call the verify endpoint (replace the values):

```powershell
curl.exe -X POST "http://localhost/api/orders/42/verify" -H "Authorization: Bearer <admin-token>"
```

The endpoint calls EasyParcel directly. On success, confirm the order has
`status=completed`, `sync_easyparcel=1`, and the corresponding shipment record.
If EasyParcel rejects the request, inspect the API error and provider response;
the order should remain unchanged. Use demo credentials to avoid live shipments.

Run the automated synchronization and payment tests without external services:

```powershell
npm test -- --runInBand modules/orders/orders-sync.service.spec.ts modules/payments/stripe/stripe.service.spec.ts
```

EasyParcel synchronization does not use Redis, background jobs, or automatic
queue retries. The former `/api/easyparcel/jobs/sample` and
`/api/easyparcel/jobs/status` endpoints have been removed.
