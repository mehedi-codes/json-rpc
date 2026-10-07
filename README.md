# json-rpc-playground — JSON-RPC 2.0, learned by doing

**Why:** we're building the IPRN Elite reseller-portal integration (`https://api.iprn-elite.com/v1.0`), and the backend talks JSON-RPC 2.0 while we know REST well. So the toy is a REST tasks API that we then **migrate to JSON-RPC 2.0** — the diff between the two wire formats is the lesson.

**Stack:** Bun (package manager + runtime) · Hono (router) · TypeScript (erasable syntax only — enforced by `"erasableSyntaxOnly": true` in `tsconfig.json`) · **lowdb** (JSON-file database). No build step.

## Run

```
bun install      # first time
bun add lowdb    # Phase A dependency (JSON-file DB)
bun run dev      # start, watch mode
bun run typecheck  # tsc, no emit
```

## The plan

- **Phase A — REST tasks CRUD.** Design and write `src/store.ts` (lowdb facade over `src/db.json`), then the routes in `src/rest-api.ts` (`GET/POST/PUT/PATCH/DELETE /tasks`), mounted from `src/index.ts`.
- **Phase B — migrate to JSON-RPC 2.0.** Same app, one `POST /rpc` endpoint: methods `task:list/get/create/update/remove`, request envelopes, notifications (no id), error objects, batches. No more per-resource routes.
- **Phase C — reshape into an IPRN-style mock** (`account:get_join`, `trunk:get_list`, the `sms.realtime` poll loop). Working notes live in `iprn-methods.md`.
- Quizzes arrive as HTML + Tailwind pages after each phase (the widget gets rebuilt when we get there).

## Layout

- `src/index.ts` — bootstrap only: create the Hono app, mount the wire modules, start the server (`Bun.serve`).
- `src/rest-api.ts` — Phase A REST routes (`/tasks`, spec in its header).
- `src/json-rpc.ts` — Phase B JSON-RPC endpoint (`POST /rpc`, methods `task:*`).
- `src/store.ts` — lowdb facade; the only module that touches `src/db.json`.
- `src/db.json` — the database file (lowdb, seeds `[]`).

## Authoring rule

The AI teaches, narrates, and reviews — **the user writes every line of project code.** No AI-generated project code, no copy-paste.
