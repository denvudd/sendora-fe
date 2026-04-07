# Next.js Template (2026)

Production-ready Next.js App Router template for teams that want strict TypeScript, automated code quality checks, and release automation from conventional commits.

- Stack: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Zod, React Hook Form, Zustand.
- Intended for: internal product teams and side projects that need a clean baseline with CI/release tooling already wired.
- Live URL: add your deployed URL here when available.

## Prerequisites

- Node.js `>=22.0.0` (CI uses Node 22)
- npm

## Getting Started

```bash
git clone <your-repo-url>
cd nextjs-template
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Project Structure

- `src/app` - Next.js App Router entrypoints (pages, layouts, global styles)
- `src/features` - domain/feature modules
- `src/shared` - shared components, hooks, constants, types, utilities
- `.github/workflows` - CI, release, and Renovate automation
- `.husky` - git hooks (`pre-commit`, `commit-msg`)

## Scripts

- `npm run dev` - start local development server
- `npm run build` - build for production
- `npm run start` - run production build locally
- `npm run lint` - run ESLint
- `npm run lint:fix` - run ESLint with auto-fix
- `npm run type-check` - run TypeScript checks (`tsc --noEmit`)
- `npm run format` - format with Prettier
- `npm run lint-staged` - run staged-file checks used by pre-commit

Note: there is currently no `preview` script in this project.

## Optional Branch: TanStack Query

TanStack Query is intentionally kept in a separate branch:

- Branch: `feat/tanstack-query`
- Includes:
  - `@tanstack/react-query`
  - `@tanstack/react-query-devtools` (development only)
  - shared query client setup in `src/shared/lib/query-client.ts`
  - provider wiring in `src/app/providers/query-provider.tsx`
  - root layout integration in `src/app/layout.tsx`

Use this branch when your project needs reactive client-side data fetching (filters, polling, infinite scroll, background refetching). Keep `main` if your app mostly relies on Server Components and Server Actions.

## Environment Variables

Required variables are validated in `src/env.ts`.

| Variable              | Required | Description                                     | Example                 |
| :-------------------- | :------- | :---------------------------------------------- | :---------------------- |
| `NODE_ENV`            | Yes      | Runtime mode used by Next.js and env validation | `development`           |
| `NEXT_PUBLIC_APP_URL` | Optional | Public base app URL exposed to browser code     | `http://localhost:3000` |

Template file:

- `.env.example`

## Branching and Commit Conventions

### Branches

- `main` - production release branch (semantic-release runs on push)
- `dev` and `master` - included in CI trigger configuration
- feature branches - open PRs into `main`/`dev` depending on your workflow

### Commits

This project enforces [Conventional Commits](https://www.conventionalcommits.org/).

- Validation is enforced by Husky `commit-msg` hook with commitlint.
- Pre-commit runs lint-staged and type checks before commit message validation.

Examples:

- `feat(auth): add magic link login`
- `fix(ci): correct release workflow permissions`
- `chore(deps): update eslint plugins`

## CI, Releases, and Dependencies

- CI (`.github/workflows/ci.yml`): runs lint, type-check, and build on PR/push to `main`, `master`, `dev`.
- Release (`.github/workflows/release.yml`): runs semantic-release on push to `main`.
- Renovate (`.github/workflows/renovate.yml`): scheduled weekly (`0 19 * * 0`) and available via manual trigger.
