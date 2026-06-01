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

FROM docker.io/nginx:alpine
COPY --from=build /app/packages/wiki/dist /usr/share/nginx/html
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    absolute_redirect off;\n\
    port_in_redirect off;\n\
    location / {\n\
        try_files $uri $uri/ $uri/index.html =404;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
