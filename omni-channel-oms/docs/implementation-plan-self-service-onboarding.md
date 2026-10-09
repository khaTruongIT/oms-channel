---
title: Self-Service Tenant Onboarding
description: Make store creation reachable from the UI and atomic across tenant, schema, and owner membership provisioning.
status: complete
priority: critical
effort: M
branch: main
tags: [saas, tenants, onboarding, frontend, backend, testing]
created: 2026-10-09
---

# Plan: Self-Service Tenant Onboarding

## Outcome

An authenticated user can create a store from the product UI, the new tenant becomes the active browser context, and onboarding activation completes only after provisioning succeeds. A failure while creating the tenant schema or owner membership rolls back the database transaction.

## Scope

- Add `/onboarding` with validated store information and a clear create state.
- Call `POST /tenants`, persist the returned tenant as the current context, then call `POST /tenants/:id/complete-onboarding` before routing to the dashboard.
- Change `TenantsService.createTenant` to use one query runner transaction for the public tenant record, tenant schema DDL, and owner membership.
- Add regression tests for transaction commit and rollback; add frontend tests for tenant creation input normalization.
- Correct the tenant list dashboard route so selecting an active store reaches the existing root dashboard.

## Acceptance criteria

- A successful request commits tenant record, schema DDL, and owner membership together.
- A provisioning error rolls back and releases the query runner; no incomplete tenant is committed.
- The onboarding form does not submit invalid shop names or blank optional values.
- After a successful onboarding request, the selected tenant is active and the user lands on `/`.

## Risks

- PostgreSQL DDL used by tenant bootstrap is transactional; this design relies on the production database keeping that behavior.
- A network failure after server-side success may leave the browser on the form. The tenant remains available from My Stores and can be selected there.
- This slice does not add a background provisioning retry queue; the atomic path removes partial state, making a retry a new create request.

## Verification

- Backend transaction tests cover commit, owner membership creation, rollback, and onboarding activation.
- Frontend tests cover input normalization; TypeScript and production builds validate the onboarding route.
