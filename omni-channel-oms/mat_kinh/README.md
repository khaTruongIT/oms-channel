# OPTIQIS Optical Lenswear MVP

Monorepo TypeScript concept platform for OPTIQIS Vietnam.

## Apps

- `apps/web`: Next.js 15 App Router public portal and CMS demo.
- `apps/api`: NestJS REST API with Swagger at `/docs`.
- `packages/shared`: shared types, seed data, filters, SEO scoring, approval workflow.
- `packages/ui`: small shared UI primitives.

## Quick Start

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm db:migrate --name init
pnpm db:seed
pnpm dev
```

Open:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/docs`

The web app falls back to rich seed data if the API is not running, so the concept can be reviewed quickly.

## MVP Scope

Included:

- Public portal, product catalog/detail, knowledge hub/article detail, clinic locator.
- Lightweight CMS article list/editor, two-tier approval workflow, SEO helper.
- Medical governance badges and educational disclaimer.

Not included in v1:

- Cart, checkout, pricing, real booking, e-warranty, Rx ordering, partner portal, full RBAC.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```
