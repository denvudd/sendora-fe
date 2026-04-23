#!/bin/sh
set -e

echo "→ Installing dependencies..."
bun install

echo "→ Generating Prisma client..."
bunx prisma generate

echo "→ Running migrations..."
bunx prisma migrate dev --skip-seed

echo "→ Starting dev server..."
exec bun dev
