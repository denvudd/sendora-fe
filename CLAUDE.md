@AGENTS.md

## Project Overview

- Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Zod + React Hook Form + Zustand.
- Goal: keep a clean template with strict layer boundaries and predictable conventions.

## Directory Structure

- `src/app`: route entrypoints, layouts, framework wiring.
- `src/features`: feature modules with domain logic.
- `src/shared`: cross-feature components, hooks, constants, types, utils.

Dependency flow:

`shared` -> `features` -> `app`

Avoid reverse imports.

## Conventions

- Prefer named exports.
- Avoid `any`.
- Destructure object params in function signatures.
- Prefer object arguments over positional arguments for complex inputs.
- Keep files focused and flat; prefer early returns.

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS, Shadcn UI
- **Database**: PostgreSQL (via Prisma, hosted on Neon)
- **Auth**: Clerk
- **State**: React Server Components (RSC) + Server Actions

## Next.js Guidance

- Use Server Components by default.
- Add `'use client'` only when needed.
- Keep `src/app` files thin and move business logic to features.
- Add `loading.tsx` and `error.tsx` for new routes to handle UX if needed.

## How to Assist

- Follow existing architecture before introducing new patterns.
- Reuse existing shared utilities/components before creating new ones.
- If a rule conflicts with existing code patterns, follow the existing project pattern.
- Don't forget to handle errors and potential edge cases
- Update the documentation files in the ./docs folder if you make changes to the feature/s that already have documentation
- Read and follow eslint and prettier configs and rules

## Package manager

Use Bun as a default package manager

## Styling, UI components, components

- Use ShadCN primitives as primary buidling bricks for the interface. Try to avoid hardcoded "plain" color values (HEX, rgba, etc.) and use Shadcn theme variables instead. Always add values and styling for the dark theme if it doesn't set by default.
- Don't forget to handle responsive layout
