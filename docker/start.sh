#!/bin/sh
set -e

if [ "$DATABASE_RUN_MIGRATIONS" = "true" ]; then
  npm run migration:run
fi

if [ "$DATABASE_RUN_SEEDS" = "true" ]; then
  npm run seed:run
fi

if [ "$APP_MODE" = "local" ]; then
  exec npm run start:dev
fi

exec npm run start:prod
