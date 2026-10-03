---
title: Frontend Implementation Plan - Lean Core Shopee Pilot
description: Plan bo sung cac tinh nang frontend con thieu de van hanh Shopee pilot mot tenant, mot kho
status: draft
priority: high
effort: L
branch: feat/frontend-shopee-pilot-ops
tags: [frontend, nextjs, operations, shopee, pilot]
created: 2026-10-03
source_plan: Lean Core Shopee Pilot - OMS dang tin cay cho mot tenant, mot kho
---

# Plan: Frontend cho Lean Core Shopee Pilot

## 1. Muc tieu

Frontend phai giup merchant van hanh pilot Shopee trong OMS ma khong phai quay lai Excel:

- Quan sat trang thai ket noi Shopee, token, webhook callback va contract gate.
- Map SKU theo tung channel account, khong map chung theo channel.
- Xu ly exception: loc, doc context da redact, retry, resolve va trigger reconciliation.
- Quan sat don hang Shopee theo canonical status moi: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
- Quan sat ton kha dung ATS: `max(0, quantity - reservedQuantity - safetyStock)`.
- Giam no type-safety dang can build: khong them `any`, khong them mock data vao operational flow.

Khong nam trong scope frontend pilot nay: returns, billing, forecasting, CRM, mobile, OPTIQIS flow, realtime WebSocket, micro-frontend, catalogue sync day du.

## 2. Hien trang da quan sat

| Khu vuc | Hien trang | Gap can xu ly |
|---|---|---|
| Connections | `frontend/app/channels/page.tsx` da co account cards, health, mapping table | Mapping form chua chon `channelAccountId`; chua co disconnect; chua co trigger reconciliation theo account |
| Exceptions | `frontend/app/exceptions/page.tsx` da co list/retry/resolve | Loc moi o client, chua day filter vao API, context redaction client chua de quy, chua co audit timeline/owner/action note |
| Orders | `frontend/hooks/useOrders.ts` va `frontend/app/orders/page.tsx` con client pagination | Status con `COMPLETED`, thieu `PROCESSING/DELIVERED`, thieu filter channel/status/external ID/channel account, con `any` |
| Order detail | `frontend/app/orders/[id]/page.tsx` status flow cu | Timeline sai lifecycle backend moi, thieu channel account, external status/time, warehouse per line |
| Inventory | `frontend/app/inventory/page.tsx` hien thi `quantity` nhu Available | Can hien ATS, reserved, safety stock, warehouse pilot, idempotency key khi adjust/reserve |
| Dashboard/Reports | `frontend/app/page.tsx`, `frontend/app/reports/page.tsx` dung mock data | Nen tach operational health that khoi analytics mock; khong dung mock cho pilot screen |
| UI foundation | `frontend/components/ui/Table.tsx` dung `any`, khong export `Column`; `activity` import `Column` nen build fail | Can generic typed table va empty/error props dung chung |
| Client API | `frontend/lib/api.ts` doc localStorage truc tiep, `_retry` implicit, swallow tenant parse error | Can typed Axios error helper, safe refresh state, khong console.log, khong leak token/PII |

## 3. Scope challenge

### Option A: Sua operational pilot surfaces truoc

- Pros: nhanh nhat de UAT Shopee pilot; giam rui ro hien thi sai don/ton; fit backend da implement.
- Cons: dashboard/report tong quan van con mock mot thoi gian.
- Complexity: L
- Risk: thap-trung binh.
- Khuyen nghi: Chon.

### Option B: Refactor toan bo frontend thanh feature folder + Server Components

- Pros: kien truc sach hon ve dai han.
- Cons: qua lon, dung nhieu file khong lien quan pilot, de xung dot dirty worktree.
- Complexity: XL
- Risk: cao.
- Khuyen nghi: Khong chon trong pilot.

### Option C: Them realtime/WebSocket integration health

- Pros: UI nhin hien dai hon.
- Cons: chua co requirement business va chua can cho 30 ngay pilot; SWR polling du dung.
- Complexity: M-L
- Risk: trung binh.
- Khuyen nghi: De sau khi pilot co traffic that.

Quyet dinh: Chon Option A. KISS/YAGNI: uu tien operational correctness hon visual polish rong.

## 4. Kien truc frontend de implement

Giu pattern hien co: Next App Router + client pages + SWR + axios. Khong rewrite sang Server Components trong dot nay.

Thu muc nen bo sung:

```text
frontend/types/
  api.ts
  integration.ts
  orders.ts
  inventory.ts
frontend/lib/
  api-error.ts
  idempotency.ts
frontend/components/operations/
  HealthMetricCard.tsx
  AccountStatusBadge.tsx
  ExceptionContextViewer.tsx
  ReconciliationPanel.tsx
```

Data flow:

```text
Channels page
  -> useChannelAccounts()
  -> useChannelMappings({ channelAccountId? })
  -> useIntegrationHealth({ channelAccountId? })
  -> triggerReconciliation(channelAccountId?)

Exceptions page
  -> URL filters: status, severity, type, account
  -> useIntegrationExceptions(filters)
  -> retry/resolve -> mutate filtered key

Orders page
  -> URL filters: page, channel, status, externalId, account
  -> useOrders(filters)
  -> fallback client pagination until backend pagination exists

Inventory page
  -> useInventory()
  -> derived ATS per row
  -> adjust/reserve with generated idempotencyKey
```

## 5. Phase breakdown

### Phase 1: Frontend foundation and build correctness

- Status: not-started
- Effort: M
- Files:
  - `frontend/components/ui/Table.tsx`
  - `frontend/app/activity/page.tsx`
  - `frontend/lib/api.ts`
  - `frontend/lib/api-error.ts`
  - `frontend/types/*.ts`
  - touched hooks using `any`

Steps:

1. Export typed `Column<T>` and `TableProps<T>`; remove `any` from table render signature.
2. Add `emptyMessage` support because `activity` already passes it.
3. Replace row key fallback index with `getRowId` prop when available.
4. Add `getApiErrorMessage(error: unknown): string` helper.
5. Type Axios retry config instead of using implicit `_retry`.
6. Remove production `console.log` from touched files.
7. Create canonical shared unions:
   - `OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"`
   - `ChannelProvider = "shopee" | "tiktok" | "lazada"`
   - integration exception status/severity.

Success criteria:

- `frontend/app/activity/page.tsx` build error is gone.
- Scoped lint passes for touched files.
- No `any` in operational files touched by this pilot.

### Phase 2: Account-aware Channels and SKU mappings

- Status: not-started
- Effort: M
- Files:
  - `frontend/app/channels/page.tsx`
  - `frontend/components/channels/MappingForm.tsx`
  - `frontend/hooks/useChannelAccounts.ts`
  - `frontend/hooks/useChannelMappings.ts`
  - `frontend/hooks/useIntegrationOperations.ts`
  - `frontend/components/operations/*`

Steps:

1. Extend mapping types with `channelAccountId`.
2. Update mapping form to select connected/pending Shopee account first; derive provider/channel from account when possible.
3. Keep non-Shopee options hidden or visually disabled for pilot, with copy explaining they are out of release.
4. Add disconnect action using `DELETE /channel-accounts/:id`.
5. Add reconciliation panel calling `POST /reconciliation-runs?channelAccountId=...`.
6. Display webhook callback ID in copyable, non-secret form.
7. Show contract gate state clearly: `PENDING_CONTRACT` means not production connected.
8. Move health metric card into reusable component and support account-level filter later.

Success criteria:

- User can register Shopee account, create mapping under that account, disconnect, reconnect, and trigger reconciliation.
- UI does not imply Shopee sync is live while backend status is `PENDING_CONTRACT`.
- Mapping table shows provider, shop, external item, external variant, product SKU.

### Phase 3: Exceptions workspace as operational queue

- Status: not-started
- Effort: M
- Files:
  - `frontend/app/exceptions/page.tsx`
  - `frontend/hooks/useIntegrationOperations.ts`
  - `frontend/components/operations/ExceptionContextViewer.tsx`
  - `frontend/components/ui/Badge.tsx`

Steps:

1. Move filters to URL search params: status, severity, type, account.
2. Pass server-supported filters to API for status/severity; keep type/account local until backend supports them.
3. Replace shallow client redaction with recursive viewer, while trusting backend redaction as source of truth.
4. Add grouped counters: open critical, retrying, oldest open exception, resolved today.
5. Add action confirmation for resolve; retry should mutate status and show retry count.
6. Add empty states by filter context, not generic.
7. Add role-based action visibility matching backend roles: owner/warehouse manager can mutate; other roles read-only.

Success criteria:

- Operator can triage exceptions without reading raw PII.
- Retry/resolve has optimistic-safe UX and refetches the exact SWR key.
- Critical exceptions older than 24h are visually escalated.

### Phase 4: API-backed Orders operations

- Status: not-started
- Effort: L
- Files:
  - `frontend/types/orders.ts`
  - `frontend/hooks/useOrders.ts`
  - `frontend/app/orders/page.tsx`
  - `frontend/app/orders/[id]/page.tsx`
  - `frontend/components/orders/CreateOrderModal.tsx`
  - `frontend/components/ui/Badge.tsx`

Steps:

1. Update order status union to match backend: remove `COMPLETED`, add `PROCESSING`, `DELIVERED`.
2. Add typed `CreateOrderInput` including `warehouseId` and optional `channelAccountId`.
3. Add filters: channel, status, external order ID, channel account.
4. Use URL search params for filter/page state so operator can share views.
5. Keep client pagination only as temporary adapter, but design hook signature for server pagination:
   `useOrders({ page, limit, channel, status, externalOrderId, channelAccountId })`.
6. Update order detail timeline to canonical lifecycle:
   `PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED`, with cancellation as side branch.
7. Show per-line `warehouseId`/warehouse name if backend response includes it; otherwise display "Allocated warehouse unavailable".
8. Show `externalStatus` and `externalStatusUpdatedAt` when present.
9. In create manual order modal, require warehouse selection and generate valid payload; keep marketplace-created orders read-only where appropriate.

Success criteria:

- UI can no longer send invalid `COMPLETED` status.
- Manual order creation includes warehouse.
- Orders table supports pilot filters required by acceptance criteria.

### Phase 5: Inventory ATS and adjustment safety

- Status: not-started
- Effort: M
- Files:
  - `frontend/types/inventory.ts`
  - `frontend/hooks/useInventory.ts`
  - `frontend/app/inventory/page.tsx`
  - `frontend/lib/idempotency.ts`
  - optional `frontend/components/inventory/*`

Steps:

1. Add derived `availableToSell = Math.max(0, quantity - reservedQuantity - safetyStock)`.
2. Rename visible "Available" column to "ATS" and show quantity/reserved/safety as separate operational numbers.
3. Add filters for warehouse, low ATS, mapped/unmapped.
4. Update `adjustStock` payload with required `idempotencyKey`.
5. Add small adjust-stock modal with reason and generated idempotency key.
6. Avoid exposing manual reserve as primary UI action unless business confirms operator workflow.
7. Cross-link mapped SKU rows to Channels mapping.

Success criteria:

- Operator sees ATS, not physical quantity, as publishable number.
- Every adjustment request includes idempotency key.
- Low stock logic uses ATS and safety stock, not raw quantity.

### Phase 6: Pilot dashboard and reports cleanup

- Status: not-started
- Effort: M
- Files:
  - `frontend/app/page.tsx`
  - `frontend/app/reports/page.tsx`
  - `frontend/hooks/useIntegrationOperations.ts`
  - possible `frontend/hooks/useDashboard.ts`

Steps:

1. Replace mock KPI cards on dashboard with operational health cards already available from `/integration-health`.
2. Add "Pilot readiness" strip:
   - Shopee account registered
   - contract gate status
   - mapped SKUs count
   - open critical exceptions
   - last reconciliation
3. Move broad sales/revenue mock charts out of default pilot dashboard or label them as unavailable until real reporting API exists.
4. Keep Reports page non-blocking for pilot; do not mix fake channel revenue with Shopee operational metrics.
5. Add stable loading/error/empty states using existing components.

Success criteria:

- No pilot-critical screen displays mock business data as real.
- Dashboard answers: "can we operate Shopee today?" within one glance.

## 6. Test plan

Minimum tests before implementation complete:

- Unit/component:
  - `Table<T>` renders typed columns, empty message, sortable header.
  - ATS calculation clamps at 0.
  - order status flow returns correct next actions.
  - recursive exception context viewer redacts nested sensitive keys.
  - API error helper handles Axios and unknown errors.
- Integration-style frontend tests:
  - Channels: register account -> create mapping payload contains `channelAccountId`.
  - Exceptions: filter by status/severity -> SWR key/API URL changes.
  - Orders: status filter and detail status update never send `COMPLETED`.
  - Inventory: adjust stock sends idempotency key.
- E2E smoke:
  - login -> channels -> register Shopee shop -> mapping modal.
  - login -> exceptions -> retry/resolve mocked API response.
  - login -> orders -> filter -> order detail -> valid status transition.

If frontend test runner is not currently configured, Phase 1 must add Vitest/Testing Library or adopt the repo's chosen test stack before feature code expands.

## 7. Red-team risks

- Backend endpoints still lack server pagination for orders; frontend can design compatible hook but cannot make true server pagination alone.
- Reconciliation endpoint currently returns `BLOCKED_CONTRACT`; UI must present that as expected gate, not as failed integration.
- Reports/dashboard mock data can mislead merchant during UAT; pilot dashboard should avoid fake revenue/channel performance.
- Strict no-`any` cleanup across entire frontend is larger than pilot. Keep scope to operational files first, then schedule broader cleanup.
- Shopee production OAuth/webhook remains blocked until official contract. Frontend must not show a "Connected" production state unless backend account status is actually `CONNECTED`.

## 8. Recommended execution order

1. Phase 1: foundation/build/type safety.
2. Phase 2: Channels + account-aware mappings.
3. Phase 3: Exceptions queue.
4. Phase 4: Orders operations.
5. Phase 5: Inventory ATS.
6. Phase 6: Pilot dashboard cleanup.

Estimated frontend effort: 2-3 weeks for one strong frontend engineer, or 1.5-2 weeks with one full-stack engineer pairing on backend response gaps. This does not include Shopee Partner API contract work.

## 9. Validation commands

Run these before considering the frontend plan done:

```bash
cd frontend
npm run lint
npm run build
```

After tests are configured:

```bash
cd frontend
npm run test
```

