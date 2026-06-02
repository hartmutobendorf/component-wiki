FROM docker.io/node:20-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/wiki/package.json packages/wiki/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

COPY data/ data/
COPY packages/shared/ packages/shared/
COPY packages/wiki/ packages/wiki/

RUN pnpm build:app

FROM docker.io/sebp/lighttpd:latest
COPY --from=build /app/packages/wiki/dist /var/www/html
COPY lighttpd.conf /etc/lighttpd/lighttpd.conf
EXPOSE 80
