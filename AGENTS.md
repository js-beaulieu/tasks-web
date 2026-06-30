# hs-web

Monorepo workspace for Home Stack browser clients.

## Layout

- `apps/tasks/` — Vue 3 + Vite browser client for the tasks app (`@hs/web-tasks`).
- `packages/web-shared/` — minimal scaffold for future shared web runtime/config code (Phase 3).

## Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build-only
pnpm test:unit --run
pnpm test:e2e
pnpm gen:api
```

## Architecture

- Auth stays at the gateway boundary. Do not add browser OAuth, JWT verification, token refresh, or `Authorization` headers.
- Browser API calls must use `credentials: "include"`.
- Use `GET /users/me` for current-user app state and ownership checks.
- Sign-out is a gateway/oauth2-proxy navigation, not app-owned auth.
- Only send `Content-Type: application/json` on requests with JSON bodies.

## API Types And Mocks

- `apps/tasks/src/api/types.gen.ts` is generated from the hs-api-tasks OpenAPI document via `pnpm gen:api`.
- If your PR changes the tasks API contract or OpenAPI shape, regenerate from the local hs-api endpoint for the branch you are changing.
- If your PR does not change the API contract, keep using the production OpenAPI URL configured in `apps/tasks/package.json`.
- Test mocks and MSW handlers must continue to use the generated API aliases from `apps/tasks/src/api/types.ts`; do not introduce a parallel handwritten mock contract.

## Testing

- Unit/API tests use the shared MSW-backed mock state under `apps/tasks/src/test/mocks/`.
- E2E tests use the Playwright route layer in `apps/tasks/e2e/msw.ts`; keep request/response shapes aligned with the generated API types.
- If you change task detail, board/list movement, or other interactive flows, add or update Playwright coverage.
