FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM builder AS local

RUN apt-get update \
  && apt-get install -y --no-install-recommends procps \
  && rm -rf /var/lib/apt/lists/* \
  && sed -i 's/\r$//' ./docker/start.sh \
  && chmod +x ./docker/start.sh

ENV NODE_ENV=development
ENV TYPEORM_RUNTIME=dist

EXPOSE 3000
CMD ["./docker/start.sh"]

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=development
ENV TYPEORM_RUNTIME=dist

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/nest-cli.json ./nest-cli.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.build.json ./tsconfig.build.json
COPY --from=builder /app/docker/start.sh ./docker/start.sh

RUN sed -i 's/\r$//' ./docker/start.sh \
  && chmod +x ./docker/start.sh

EXPOSE 3000

CMD ["./docker/start.sh"]
