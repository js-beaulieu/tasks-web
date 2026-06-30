FROM node:22-alpine AS build
ARG DOMAIN
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/tasks/package.json apps/tasks/
COPY packages/web-shared/package.json packages/web-shared/
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
ENV VITE_TASKS_API_BASE_URL=https://api.${DOMAIN}/tasks
RUN pnpm build --filter @hs/web-tasks

FROM joseluisq/static-web-server:2
ENV SERVER_ROOT=/public SERVER_FALLBACK_PATH=/public/index.html
COPY --from=build /app/apps/tasks/dist/ /public/
