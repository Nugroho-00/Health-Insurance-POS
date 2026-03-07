# Health Insurance Payment Orchestration Service

## Operational Runbook

A full-stack middleware connecting a Wix storefront to an internal Financial Ledger via a double-entry accounting system.

---

## ⚡ Quick Start (Docker Compose)

```bash
# 1. Clone the repository
git clone <your-repo-url> && cd tech_test

# 2. Create your environment file
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Verify all services are healthy
docker-compose ps
```

| Service               | URL                            |
| --------------------- | ------------------------------ |
| Storefront (React)    | http://localhost:5173          |
| Back-Office Dashboard | http://localhost:5173/admin    |
| Backend API           | http://localhost:3000          |
| Swagger Docs          | http://localhost:3000/api/docs |
| PostgreSQL            | localhost:5432                 |
| Redis                 | localhost:6379                 |

---

## 🏗️ Project Structure

```
tech_test/
├── docker-compose.yml      # Orchestrates all services
├── .env.example            # Environment variable template
├── SAD.md                  # System Architecture Document
├── openapi.yaml            # OpenAPI 3.0 specification
├── backend/                # NestJS API (Port 3000)
│   ├── src/
│   │   ├── wix-adapter/    # POST /v1/create-order + HMAC
│   │   ├── gateway-simulator/ # Mock payment gateway
│   │   ├── payment-processor/ # BullMQ worker
│   │   ├── ledger/         # Double-entry ledger service
│   │   └── admin/          # Back-office API endpoints
│   └── Dockerfile
└── frontend/               # React + Vite (Port 5173)
    ├── src/
    │   ├── pages/Storefront/  # Insurance plan selection + checkout
    │   ├── pages/BackOffice/  # Transaction monitor + reconciliation
    │   ├── hooks/             # TanStack Query hooks
    │   └── services/          # API service layer
    └── Dockerfile
```

---

## 🔧 Local Development (Without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Backend

```bash
cd backend
npm install
cp .env.example .env      # Configure DB and Redis connections
npm run start:dev         # Starts with hot-reload on port 3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # Starts Vite dev server on port 5173
```

---

## 🔐 HMAC Signature Generation

The frontend auto-generates HMAC-SHA256 signatures. To test manually:

```bash
# Using Node.js
node -e "
const crypto = require('crypto');
const payload = {
  merchantId: 'health-assurance-001',
  order: { id: 'test-order-001', amount: 150, currency: 'USD', description: 'Monthly Health Premium' },
  customer: { email: 'test@example.com' }
};
const sig = crypto.createHmac('sha256', 'HEALTH_SECRET_KEY_SUPER_SECURE').update(JSON.stringify(payload)).digest('hex');
console.log(sig);
"

# Then use the signature in your request:
curl -X POST http://localhost:3000/v1/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "merchantId": "health-assurance-001",
      "order": { "id": "test-order-001", "amount": 150, "currency": "USD", "description": "Monthly Health Premium" },
      "customer": { "email": "test@example.com" }
    },
    "signature": "<paste-sig-here>"
  }'
```

---

## 🚨 Handling a Failed Transaction Manually

### Scenario: Payment queued but never processed (worker crashed)

```bash
# 1. Check transaction status
curl http://localhost:3000/admin/transactions

# 2. Identify PENDING transactions (stuck after worker restart)
# A PENDING status after >30 seconds suggests the worker missed it

# 3. View BullMQ failed jobs via Redis CLI
docker exec -it health_pos_redis redis-cli
> XLEN payment-queue  # Check stream length

# 4. Restart the backend to reconnect the worker
docker-compose restart backend

# 5. If a transaction is stuck PENDING, you can manually re-trigger
# by POSTing the same order with a NEW wix_order_id (idempotency prevents reuse)
```

### Scenario: Ledger entries out of balance

```bash
# 1. Query the database directly
docker exec -it health_pos_postgres \
  psql -U health_user -d health_pos_db \
  -c "SELECT transaction_id, SUM(amount) as balance FROM ledger_entries GROUP BY transaction_id HAVING SUM(amount) != 0;"

# 2. A healthy system returns 0 rows (all balances = 0.0000)
# 3. Any rows returned indicate corrupted double-entry entries — investigate the worker logs:
docker-compose logs backend --tail=200 | grep "Ledger write failed"
```

---

## 📊 Monitoring

```bash
# View backend logs
docker-compose logs -f backend

# View worker activity
docker-compose logs -f backend | grep "PaymentProcessor"

# View all service logs
docker-compose logs -f

# Check service health
docker-compose ps
```

---

## 🧪 Verification Checklist

- [ ] `docker-compose up -d` — all 4 services start (postgres, redis, backend, frontend)
- [ ] http://localhost:5173 — Storefront loads, shows 3 plan cards
- [ ] Select "Family ($150)" → fill form → click Pay → shows "Processing..."
- [ ] After 2-10 seconds → shows "Success" OR "Declined" (10% chance)
- [ ] http://localhost:5173/admin → Back-Office shows the transaction
- [ ] Click transaction row → shows 2 ledger entries (CREDIT + DEBIT, sum = 0.0000)
- [ ] Click "Fetch Gateway Report" → reconciliation runs, may show discrepancies in red
- [ ] POST same `wix_order_id` twice → second request returns cached `PENDING` (idempotency)
- [ ] POST with wrong signature → returns 401 Unauthorized

---

## Tech Stack

| Layer            | Technology                                         |
| ---------------- | -------------------------------------------------- |
| Backend          | NestJS 10 + TypeScript                             |
| ORM              | TypeORM 0.3 (`QueryRunner` for ACID ledger writes) |
| Queue            | BullMQ 5 + Redis 7                                 |
| Database         | PostgreSQL 16                                      |
| Frontend         | React 19 + Vite 6                                  |
| UI               | Shadcn/UI + Tailwind CSS 3                         |
| Data Fetching    | TanStack Query v5                                  |
| HTTP             | Axios                                              |
| Containerization | Docker + Docker Compose                            |
