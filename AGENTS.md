# tasks-web

Vue 3 + Vite + TypeScript browser client for `tasks-api`.

## Commands

```bash
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

- `src/api/types.gen.ts` is generated from the tasks-api OpenAPI document via `pnpm gen:api`.
- If your PR changes the tasks-api API contract or OpenAPI shape, regenerate from the local tasks-api endpoint for the branch you are changing.
- If your PR does not change the API contract, keep using the production OpenAPI URL configured in `package.json`.
- Test mocks and MSW handlers must continue to use the generated API aliases from `src/api/types.ts`; do not introduce a parallel handwritten mock contract.

## Testing

- Unit/API tests use the shared MSW-backed mock state under `src/test/mocks/`.
- E2E tests use the Playwright route layer in `e2e/msw.ts`; keep request/response shapes aligned with the generated API types.
- If you change task detail, board/list movement, or other interactive flows, add or update Playwright coverage.
