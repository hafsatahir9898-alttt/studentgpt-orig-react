# StudentGPT

StudentGPT is an authenticated AI-powered academic workspace for students. It is designed around private, user-owned study data rather than static dashboard content. The current implementation includes a real Supabase email/password entry flow, Supabase session verification at the API boundary, persistent profiles, a normalized workspace data model, and real subject management backed by the database.

## Application stack

| Layer | Current implementation | Deployment boundary |
|---|---|---|
| Client | React 19, TypeScript, Vite, Tailwind CSS | Static client assets served by the Node application |
| API | Express + tRPC + TypeScript | Stateless server process |
| Authentication | Supabase Auth with bearer-token verification on the server | Supabase project configuration |
| Persistent data | Managed MySQL/TiDB through Drizzle | Database connection supplied by the platform |
| Private document storage | Managed S3-compatible storage through the server storage helper | Server-only platform credentials |
| AI | Server-side OpenRouter adapter with built-in provider fallback | Server-only provider key |

## Required environment variables

Copy `.env.example` to `.env` only for local development. Do not commit `.env`, provider keys, or exported sessions. The values below must come from the same Supabase project.

| Variable | Required for | Exposure rule |
|---|---|---|
| `SUPABASE_URL` | Browser sign-in client and server validation | Client-safe through the limited configuration route |
| `SUPABASE_ANON_KEY` | Browser email/password authentication | Client-safe publishable key only |
| `SUPABASE_SERVICE_ROLE_KEY` | Server verification and private document operations | **Server-only; never use in client code** |
| `DATABASE_URL` | Persistent platform records | Server-only |
| `OPENROUTER_API_KEY` | Preferred server-side chat, research, notes, revision, quiz, and flashcard generation | **Server-only; never use in client code** |
| `OPENROUTER_API_URL` | Optional OpenRouter endpoint override; defaults to `https://openrouter.ai/api/v1` | Server-only |
| `OPENROUTER_MODEL` | Optional OpenRouter model override; defaults to `openai/gpt-4o-mini` | Server-only |
| `BUILT_IN_FORGE_API_URL` | Fallback server AI provider integration when OpenRouter is not configured | Server-only |
| `BUILT_IN_FORGE_API_KEY` | Fallback server AI provider integration | **Server-only** |

## Local development

Install dependencies and start the application:

```bash
pnpm install
pnpm dev
```

When `OPENROUTER_API_KEY` is present, the shared server-side `invokeLLM` helper routes text and structured generation through OpenRouter. The existing built-in provider remains available as a fallback only when OpenRouter is not configured. The client and Flutter APK never receive either provider key.

Run validation before submitting or deploying changes:

```bash
pnpm check
pnpm test
pnpm build
```

The initial database migration is stored in `drizzle/0001_absent_gwen_stacy.sql`. In a fresh database, generate and review Drizzle migrations before applying them. The managed environment uses the configured database connection; do not run destructive schema commands against production.

## Authentication setup

In Supabase, enable Email authentication and configure the site URL plus the allowed redirect URLs. The production or preview application origin must be allow-listed; otherwise a confirmation email can fall back to the Supabase project Site URL, which is commonly localhost during development.

```text
https://YOUR-DEPLOYED-DOMAIN/login?reset=1
https://YOUR-DEPLOYED-DOMAIN/login
```

The browser only receives the Supabase URL and anon/publishable key. StudentGPT sign-up sends its confirmation link to the current `/login` origin, and password-reset links to `/login?reset=1`. Each API request supplies the current Supabase access token; `server/_core/context.ts` validates it through the server-side Supabase client, creates or updates the corresponding StudentGPT user record, and rejects unauthenticated protected procedures. Application records always carry a `userId`, and server data queries filter by that identity.

## Document privacy requirement

The document module uses the managed S3-compatible storage helper with user-scoped object keys. It verifies ownership before issuing a short-lived retrieval redirect and never stores public document URLs in the database. Uploaded PDFs are limited to 12 MB and use request-bounded text extraction; a larger-scale deployment should move queued extraction and embedding to a durable worker service.

## Deployment preparation

The app has a Node build and production start command in `package.json`. Set `OPENROUTER_API_KEY` and any optional `OPENROUTER_MODEL` value in the hosting platform’s encrypted environment configuration. Keep the built-in provider credentials only as a fallback. Run the test/build commands in CI and configure the Supabase redirect URL for the final domain. The web/API process is stateless; document processing should run in a separate worker service with a durable queue so extraction never blocks an interactive study session.

> The managed project template currently provides a React + Express + tRPC runtime with its own database service. The included Supabase integration is used for authentication and private object storage. An external PostgreSQL/`pgvector` deployment remains an explicit scale-out migration path for the retrieval service rather than a hidden replacement for the running data layer.
