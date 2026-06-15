FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM joseluisq/static-web-server:2-scratch
ENV SERVER_ROOT=/public SERVER_FALLBACK_PATH=/public/index.html
COPY --from=build /app/dist/ /public/