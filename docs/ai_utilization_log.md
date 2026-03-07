# AI Utilization Log

## Health Insurance Payment Orchestration Service

---

## Entry 1

**Goals:** Design the system architecture — understand what components are needed, how they interact, and what technology decisions to make for a double-entry financial ledger system.

**Prompt:**

> Build a Health Insurance Payment Orchestration Service with NestJS backend, React frontend, PostgreSQL, Redis/BullMQ queue, HMAC signature validation, idempotency enforcement, and double-entry ledger. Tech stack: NestJS + TypeORM + BullMQ (backend), React + Vite + Tailwind + Shadcn UI + TanStack Query (frontend). Monorepo with docker-compose. Follow NestJS best practices (feature modules, DTOs with class-validator, global ValidationPipe, global HttpExceptionFilter).

**Results:**

- Designed a 4-layer architecture: Frontend → Wix SPI Adapter → BullMQ Queue → Background Worker → PostgreSQL Ledger
- Identified the critical design decision: use `QueryRunner` (not TypeORM's `.save()`) for the double-entry write to guarantee ACID atomicity
- Decided on TypeORM over Prisma specifically because `QueryRunner` provides fine-grained transaction control needed for financial integrity
- Confirmed: `DECIMAL(19,4)` for all money fields; convert to string with `toFixed(4)` in TypeScript before any DB write

---

## Entry 2

**Goals:** Implement the HMAC validation middleware in a timing-attack-safe manner.

**Prompt:**

> Implement NestJS middleware for HMAC-SHA256 signature validation. Must use crypto.timingSafeEqual() instead of !== string comparison to prevent timing attacks. Handle the edge case where buffers have different lengths (timingSafeEqual throws on length mismatch).

**Results:**

- `crypto.timingSafeEqual()` throws a `RangeError` if buffers have different byte lengths
- Solution: wrap in try/catch and treat any exception as a mismatch (`signaturesMatch = false`)
- This is critical because an attacker sending a short signature would otherwise crash the middleware instead of getting a clean 401

---

## Entry 3

**Goals:** Implement idempotency for the Wix SPI endpoint to prevent double-charging.

**Prompt:**

> Design idempotency for POST /v1/create-order using PostgreSQL. The wix_order_id must be globally unique. If a duplicate request arrives, return the cached response without re-processing. Handle race conditions.

**Results:**

- Created `idempotency_keys` table with `UNIQUE` index on `wix_order_id`
- Flow: check if exists → if yes, return cached status (don't re-enqueue)
- PostgreSQL's unique constraint is the last line of defense against race conditions between the check and insert
- Status lifecycle: PENDING → COMPLETED | FAILED

---

## Entry 4

**Goals:** Implement the double-entry ledger writer in the BullMQ worker using atomic transactions.

**Prompt:**

> Write BullMQ PaymentProcessor that writes exactly 2 ledger entries atomically using TypeORM QueryRunner. On gateway success: CREDIT REVENUE +amount, DEBIT GATEWAY_RECEIVABLE -amount. On any error: rollback. Update idempotency status in the same transaction. Handle gateway failures and BullMQ retry logic.

**Results:**

- Used `queryRunner.startTransaction()` → multiple inserts + one update → `commitTransaction()`
- If `commitTransaction()` throws, `rollbackTransaction()` in the catch block ensures no orphaned entries
- Both ledger inserts AND the status update happen in the SAME transaction → either all commit or all rollback
- Amount conversion: `amount.toFixed(4)` and `(-amount).toFixed(4)` before DB write to avoid floating-point precision issues

---

## Entry 5

**Goals:** Design the React frontend with Shadcn UI + TanStack Query for real-time updates and proper UX states.

**Prompt:**

> Build React storefront with 3 insurance plan cards (Basic $50, Family $150, Executive $500), checkout form with card number/expiry formatting, and 4 UI states: idle, processing (spinner), success, declined. Build Back-Office dashboard with 5s polling, expandable rows showing ledger audit, and reconciliation with red discrepancy highlighting. Use TanStack Query v5, Shadcn UI, Tailwind CSS.

**Results:**

- Storefront: Plan cards with selected state highlighting, card number auto-formatting (groups of 4), expiry MM/YY formatting
- TanStack Query: `useMutation` for payment (with cache invalidation), `useQuery` with `refetchInterval: 5000` for polling, `enabled: false` for on-demand reconciliation trigger
- Payment state machine: idle → processing → success/declined
- BackOffice: expandable `<tr>` rows showing `LedgerAuditPanel` component, reconciliation highlights discrepancies using `bg-red-950/30` rows
- HMAC signature generation in frontend: uses `crypto-js` (browser-compatible HMAC)

---

## Entry 6

**Goals:** Handle the 10% gateway failure rate gracefully with BullMQ retry logic.

**Prompt:**

> Configure BullMQ to retry failed payment jobs 3 times with exponential backoff. After final failure, mark the IdempotencyKey as FAILED. The GatewaySimulatorService should throw a custom GatewayException that the processor can catch and decide whether to mark as permanently failed based on attemptsMade vs maxAttempts.

**Results:**

- Job options: `attempts: 3, backoff: { type: 'exponential', delay: 2000 }` → retries at 2s, 4s, 8s
- Worker checks `job.attemptsMade + 1 >= maxAttempts` before marking FAILED — only marks as permanently failed on the last attempt
- On retry attempts → re-throws the error → BullMQ automatically retries
- Important: idempotency key status stays PENDING during retries, only becomes FAILED after all retries exhausted
