# Fullstack AI Sales Bot with CRM

## Demo

https://4war8f91kk.ucarecd.net/fbf8d373-bea0-4eff-bfa4-fe29e4378f91/

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Styling:** Tailwind CSS 4, Shadcn UI
- **Auth:** Clerk
- **Database:** PostgreSQL via Prisma (hosted on Neon)
- **AI:** OpenAI SDK (`ai`, `@ai-sdk/openai`)
- **Payments:** Stripe
- **Realtime:** Pusher
- **File uploads:** Uploadcare
- **Email:** Resend
- **Integrations:** Google Calendar (OAuth), HubSpot CRM
- **State:** Zustand (client), RSC + Server Actions (server)

## Core Libraries

- `zod` — schema validation
- `react-hook-form` + `@hookform/resolvers` — form state and validation
- `@t3-oss/env-nextjs` — runtime env variable validation
- `clsx` + `tailwind-merge` — safe className composition
- `date-fns` — date utilities
- `recharts` — charts

## Project Structure

```
src/app       — route entrypoints, layouts, providers
src/features  — domain and feature logic
src/shared    — shared components, hooks, constants, utils, types
```

Dependency flow: `shared` → `features` → `app`. No reverse imports.

## Requirements

- Node.js `>=22.0.0`
- Bun
- Docker + Docker Compose (optional, for Docker-based local dev)

## Local Development

**Without Docker:**

```bash
bun install
cp .env.example .env
# fill in real values in .env
bun dev
```

**With Docker:**

```bash
cp .env.example .env
# fill in real values in .env
docker compose up --build
```

App runs on `http://localhost:3000`.

On first Docker start: installs deps, generates Prisma client, runs migrations, starts dev server. Hot reload works via filesystem polling (required on Windows).

### Docker commands

```bash
docker compose up --build        # first run (builds image)
docker compose up                # normal start
docker compose down              # stop
docker compose down -v           # full reset (removes named volumes)

docker compose exec app bunx prisma migrate dev --name <name>  # new migration
docker compose exec app bunx prisma studio                     # Prisma Studio
docker compose exec app bun prisma:seed                        # seed DB
docker compose exec app sh                                     # shell
```

## Scripts

| Command                  | Description                       |
| ------------------------ | --------------------------------- |
| `bun dev`                | Start dev server                  |
| `bun build`              | Production build                  |
| `bun start`              | Run production build              |
| `bun lint`               | ESLint check                      |
| `bun lint:fix`           | ESLint with auto-fix              |
| `bun type-check`         | TypeScript check (`tsc --noEmit`) |
| `bun format`             | Prettier format                   |
| `bun prisma:generate`    | Generate Prisma client            |
| `bun prisma:migrate:dev` | Create and apply migration        |
| `bun prisma:seed`        | Seed the database                 |

## Environment Variables

All variables are documented in `.env.example` and validated at runtime in `src/env.ts`.

Key groups:

| Group      | Variables                                                                          |
| ---------- | ---------------------------------------------------------------------------------- |
| App        | `NEXT_PUBLIC_APP_URL`, `NODE_ENV`                                                  |
| Database   | `DATABASE_URL`, `DIRECT_URL`                                                       |
| Clerk      | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, redirect URLs             |
| OpenAI     | `OPENAI_API_KEY`                                                                   |
| Stripe     | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Pusher     | `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` + public variants |
| Uploadcare | `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY`                                                |
| Resend     | `RESEND_API_KEY`                                                                   |
| Google     | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`                  |
| HubSpot    | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`, `HUBSPOT_REDIRECT_URI`               |

## Commit Convention

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) — enforced by `commitlint` via Husky pre-commit hook.

```
feat: add new feature
fix: fix a bug
chore: maintenance task
docs: documentation only
refactor: code change without feature/fix
```

Breaking changes: append `!` after type or add `BREAKING CHANGE:` footer.

## Git Hooks (Husky + lint-staged)

On every commit:

- `eslint --fix` + `prettier --write` on staged `*.{js,ts,tsx}` files
- `prettier --write` on staged `*.{json,md}` files
- `commitlint` validates the commit message format

## CI/CD (GitHub Actions)

| Workflow     | Trigger                    | Steps                                                      |
| ------------ | -------------------------- | ---------------------------------------------------------- |
| **CI**       | PR or push to `main`/`dev` | lint → type-check → build                                  |
| **Release**  | Push to `main`             | semantic-release (changelog, GitHub release, version bump) |
| **Deploy**   | Push to `main`             | build → rsync standalone to DigitalOcean → pm2 restart     |
| **Renovate** | Schedule                   | Dependency update PRs                                      |

## Releases

Releases are automated via [semantic-release](https://semantic-release.gitbook.io/) on push to `main`:

- Analyzes commits since last release
- Bumps version in `package.json` based on commit types (`feat` → minor, `fix` → patch, breaking → major)
- Generates `CHANGELOG.md`
- Creates a GitHub release with release notes

## Deployment

The app is deployed to a DigitalOcean Droplet as a Next.js standalone build, served via `pm2`.

**Deploy sequence (triggered on push to `main`):**

1. **Install deps** — `bun install --frozen-lockfile`
2. **Generate Prisma client** — `bunx prisma generate`
3. **Run migrations** — `bunx prisma migrate deploy` (non-interactive, applies pending migrations against production DB via `DIRECT_URL`)
4. **Build** — `bun run build` (outputs standalone bundle to `.next/standalone/`)
5. **Prepare artifact** — copies `.next/static/` and `public/` into the standalone folder
6. **Rsync to Droplet** — transfers `.next/standalone/` to `/var/www/sendora/` via SSH, with `--delete` to remove stale files (excludes `.env.local`)
7. **Restart** — SSH into Droplet, runs `pm2 restart sendora` (or `pm2 start server.js --name sendora` on first deploy), then `pm2 save`

**Server setup:** the Droplet runs Node.js + pm2. The standalone `server.js` is the Next.js production server — no separate web server (nginx/caddy) required unless you add one for SSL termination.
