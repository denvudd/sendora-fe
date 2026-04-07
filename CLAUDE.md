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

## Next.js Guidance

- Use Server Components by default.
- Add `'use client'` only when needed.
- Keep `src/app` files thin and move business logic to features.

## How to Assist

- Follow existing architecture before introducing new patterns.
- Reuse existing shared utilities/components before creating new ones.
- If a rule conflicts with existing code patterns, follow the existing project pattern.
