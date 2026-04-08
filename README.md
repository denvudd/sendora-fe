# Next.js Application

This repository contains a production-oriented Next.js application template with strict TypeScript setup, App Router architecture, and automated quality checks.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4

## Core Libraries

- `zod` - schema validation and type-safe contracts
- `react-hook-form` + `@hookform/resolvers` - form state and validation integration
- `zustand` - local client state management
- `@tanstack/react-query` - server-state fetching, caching, and synchronization
- `@t3-oss/env-nextjs` - runtime environment variable validation
- `clsx` + `tailwind-merge` - safe Tailwind className composition without conflicts

## Project Structure

- `src/app` - route entrypoints, layouts, and global providers
- `src/features` - domain and feature logic
- `src/shared` - shared components, hooks, utilities, and types

## Requirements

- Node.js `>=22.0.0`
- bun

## Local Development

```bash
bun install
cp .env.example .env.local
bun run dev
```

App runs on `http://localhost:3000`.

## Scripts

- `bun run dev` - start the development server
- `bun run build` - create a production build
- `bun run start` - run the production build locally
- `bun run lint` - run ESLint checks
- `bun run lint:fix` - run ESLint with auto-fixes
- `bun run type-check` - run TypeScript checks (`tsc --noEmit`)
- `bun run format` - format files with Prettier

## Environment Variables

- Variables are documented in `.env.example`
- Local configuration file: `.env.local`
- Required variables are validated in `src/env.ts`

## CI and Releases

- CI runs lint, type-check, and build on pull requests and pushes
- Releases can be automated using conventional commits and semantic-release

## Deployment

- The application is deployable to any Node.js-compatible platform.
- For managed hosting, Vercel is the default option for Next.js projects.
- Production runtime requires Node.js `>=22.0.0`.
