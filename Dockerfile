FROM node:22-alpine AS build
ARG DOMAIN
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
ENV VITE_TASKS_API_BASE_URL=https://api.${DOMAIN}/tasks
RUN pnpm build

FROM joseluisq/static-web-server:2
ENV SERVER_ROOT=/public SERVER_FALLBACK_PATH=/public/index.html
COPY --from=build /app/dist/ /public/