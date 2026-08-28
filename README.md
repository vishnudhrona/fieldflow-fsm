# 🛠️ FieldFlow FSM — Offline-First Field Service Management System

FieldFlow FSM is a production-grade, offline-first Field Service Management progressive web application. Designed for field technicians in low- or zero-connectivity environments, it features robust offline local persistence (Dexie/IndexedDB), optimistic UI mutations, automatic background batch synchronization (`/api/sync/batch`), cryptographic idempotency (`X-Idempotency-Key`), conflict detection (`COMPLETED` vs `CANCELLED`), and resilient photo queues with local Base64/S3 fallback.

---

## ⚡ Interviewer Quick Start (Zero-Friction Setup in < 2 Minutes)

If you are reviewing or evaluating this repository for the first time, run the following commands:

```bash
# 1. Clone the repository
git clone https://github.com/vishnudhrona/fieldflow-fsm.git
cd fieldflow-fsm

# 2. Setup and start Backend (Terminal 1)
cd backend
npm install
copy .env.example .env          # On macOS/Linux use: cp .env.example .env
npm run db:create               # Creates the PostgreSQL database
npm run db:migrate              # Executes all 16 Sequelize migrations
npm run db:seed                 # Seeds demo users, work orders, assets & customers
npm run dev                     # Starts Express backend on http://localhost:8080

# 3. Setup and start Frontend (Terminal 2)
cd ../frontend
npm install
copy .env.example .env          # On macOS/Linux use: cp .env.example .env
npm run dev                     # Starts Vite dev server on http://localhost:5173
```

👉 Open **http://localhost:5173** in your browser and use the **1-Click Quick Demo Autofill** buttons on the login screen!

---

## 📋 Prerequisites & Verified Versions

| Tool | Minimum Version | Tested & Verified Version | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.x` | `v22.16.0` (LTS) | Native `node:test` runner & built-in `crypto` support |
| **npm** | `v9.x` | `v10.9.2` | Standard Node package manager |
| **PostgreSQL** | `v14.x` | `v17.5` | Running locally or via Docker |
| **Docker** | `v20.x` *(Optional)* | Docker Desktop / Docker Compose v2 | Optional containerized setup |

---

## 🔑 Demo Credentials & Capabilities

The database seeder populates standard accounts with pre-hashed SHA-256 passwords:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin / Dispatcher** | `admin@example.com` | `admin123` | Create & manage customers/assets; dispatch work orders; cancel jobs; audit company-wide activity history. |
| **Field Technician (Primary)** | `tech@example.com` | `tech123` | View assigned jobs; execute checklists & readings offline; attach job site photos; complete jobs; manage outbox sync queue. |
| **Field Technician (Secondary)** | `tech2@example.com` | `tech123` | Additional technician assigned to Emergency Hospital Generator inspection (`WO-1002`). |
| **Field Technician (Tertiary)** | `tech3@example.com` | `tech123` | Additional technician for multi-user assignment testing. |

> 💡 **Tip**: The login page (`/login`) provides **1-Click Quick Demo Autofill** buttons for instant role switching without typing.

---

## ⚙️ Environment Configuration

Both backend and frontend come with documented `.env.example` template files:

### Backend (`backend/.env`)

```ini
# Server Configuration (Required)
PORT=8080
NODE_ENV=development

# JWT Secret Key (Required - min 32 characters)
JWT_SECRET=your_development_jwt_secret_key_change_in_production_12345

# Database Configuration - PostgreSQL (Required)
# Option 1: Individual parameters (Recommended for local dev)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fieldflow_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_SSL=false

# Option 2: Connection URL (Alternative / Cloud DBs)
# DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/fieldflow_db

# AWS S3 Storage (Optional - Local demo automatically falls back to Base64 data URLs)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
```

### Frontend (`frontend/.env`)

```ini
# Backend API Base URL (Required)
VITE_API_URL=http://localhost:8080/api
```

---

## 🗄️ Database Setup & Bootstrap Lifecycle

The backend includes complete Sequelize migrations and seeders that build the schema and populate initial demo data cleanly from scratch:

```bash
cd backend

# Create the database (if not already created)
npm run db:create

# Run all schema migrations
npm run db:migrate

# Seed demo customers, assets, technicians, work orders, checklists, notes, readings & attachments
npm run db:seed

# Optional: Rollback latest migration (safety check)
npm run db:migrate:undo
```

### Schema & Initial Seed Data Summary
- **16 Migrations**: `users`, `customers`, `menus`, `assets`, `work_orders`, `work_order_checklists`, `work_order_notes`, `work_order_attachments`, `work_order_histories`, `work_order_readings`, `sync_operations` (idempotency store), `work_order_conflicts` (conflict store), composite indexes & partial unique constraints.
- **Seeded Entities**: 4 Users (1 Dispatcher + 3 Technicians), 3 Industrial Customers, 3 Equipment Assets with high-res machinery photos, 3 Work Orders (`WO-1001`, `WO-1002`, `WO-1003`), 9 Checklists, 9 Service Readings, 9 Field Notes, 9 Attachments, and 9 Audit History logs.

---

## 🚀 Running the Application

### 1. Start the Backend API

```bash
cd backend
npm run dev
```
- **Backend Port**: `http://localhost:8080`
- **Health Check**: `GET http://localhost:8080/health` or `GET http://localhost:8080/api/health/ready`
- **Response**: `{"status": "ok", "database": "connected", "timestamp": "..."}`

### 2. Start the Frontend App

In a separate terminal:
```bash
cd frontend
npm run dev
```
- **Frontend Port**: `http://localhost:5173`
- **Vite Proxy**: Automatically proxies `/api` requests to `http://localhost:8080`

---

## 🐳 Docker Support (Self-Contained Stack)

To run the complete stack (PostgreSQL + Express Backend + React Nginx Frontend) with Docker:

```bash
docker compose up --build
```

- **Frontend Application**: `http://localhost` (Port 80)
- **Backend API**: `http://localhost:8080`
- **PostgreSQL Database**: `localhost:5432` (`fieldflow_db` / `postgres` / `postgrespassword`)

To run migrations and seeders inside Docker:
```bash
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

---

## 🧪 7 Live Demonstration Scenarios

| # | Test Scenario | Step-by-Step Verification | Mechanism |
| :-: | :--- | :--- | :--- |
| **1** | **Online Work Order Lifecycle** | 1. Log in as `admin@example.com`.<br>2. Dispatch a work order to `Tech User`.<br>3. Log in as `tech@example.com` and start work order $\to$ mark checklist complete $\to$ complete job. | Real-time REST API mutations, history audit logs recorded on PostgreSQL. |
| **2** | **Offline Persistence & Restart** | 1. Log in as `tech@example.com`.<br>2. Toggle **Network Simulator** (top bar) to `OFFLINE`.<br>3. Open `WO-1001`, add a note and service reading.<br>4. Hard-refresh the browser (`Ctrl+F5` / `Cmd+Shift+R`).<br>5. Notice all changes survive in the UI with a `PENDING_SYNC` badge. | Local persistence in Dexie IndexedDB (`fieldflow_fsm_db_<userId>`). |
| **3** | **Automatic Outbox Sync** | 1. With mutations queued in the Outbox drawer, toggle the **Network Simulator** back to `ONLINE`.<br>2. Watch the top outbox counter automatically clear as mutations sync. | `SyncEngine.processOutbox()` pushes batch payload to `/api/sync/batch`. |
| **4** | **COMPLETED vs CANCELLED Conflict Detection** | 1. In one browser/incognito tab as `tech@example.com`, go `OFFLINE` and complete `WO-1001`.<br>2. In another tab as `admin@example.com`, cancel `WO-1001`.<br>3. Reconnect technician tab to `ONLINE`.<br>4. The outbox detects version conflict, flags item as `CONFLICT`, records a conflict record on server, and prevents silent data loss. | Server-side optimistic version check and `WorkOrderConflict` ledger. |
| **5** | **Idempotent Retry Handling** | 1. Trigger repeated sync attempts on unstable connection.<br>2. Observe backend verifies `mutationId` against `sync_operations` table.<br>3. Duplicate requests return cached replay responses without double-updating records. | Cryptographic payload hash (`SHA-256`) and `sync_operations` locking. |
| **6** | **Offline Photo Attachment Survival & Storage** | 1. In `OFFLINE` mode, open a work order and upload/take a photo.<br>2. Photo is stored as a raw `Blob` in IndexedDB attachments table.<br>3. Browser reload preserves photo.<br>4. When `ONLINE` is restored, `photoSyncEngine` uploads photo (using S3 if configured, or local Base64 data URL fallback). | `photoSyncEngine` queue with automatic Base64/S3 fallback. |
| **7** | **Security & Row-Level Authorization** | 1. Log in as `tech@example.com`.<br>2. Attempt to view or modify `WO-1002` (assigned to Sarah Jenkins).<br>3. Server returns `403 Forbidden` / `FAILED: Forbidden: work order is not assigned to you`. | JWT Bearer authentication + Sequelize row-level ownership validation. |

---

## 🏗️ Architecture & Documentation Suite

Detailed architectural, data model, and conflict-handling breakdowns are available in [`/docs`](./docs):

- 📐 **[System Architecture & Data Model (docs/ARCHITECTURE.md)](./docs/ARCHITECTURE.md)**: High-level architectural diagrams, Dexie schema design, PWA caching strategy, and answers to core design questions.
- ⚡ **[Conflict Resolution Strategy & Idempotency (docs/CONFLICT_RESOLUTION.md)](./docs/CONFLICT_RESOLUTION.md)**: Deep dive into outbox queue states, `X-Idempotency-Key` deduplication, and conflict resolution mechanisms.
- 📡 **[API Specification Reference (docs/API_SPECIFICATION.md)](./docs/API_SPECIFICATION.md)**: Complete REST API contract, auth headers, and `/api/sync/batch` request/response schemas.
- 📊 **[Entity Relationship Diagram (docs/ER_DIAGRAM.md)](./docs/ER_DIAGRAM.md)**: PostgreSQL database schema, tables, foreign keys, and indexes.

---

## 🛠️ Testing, Linting & Production Build

### Running Tests
```bash
# Backend unit & sync integration tests (Node.js test runner)
cd backend
npm test
```
*Executes 13 unit & concurrency validation tests across idempotency, string sanitizers, version conflict detection, and row-level authorization.*

### Running Linters
```bash
# Frontend fast linter (Oxlint)
cd frontend
npm run lint
```

### Production Builds
```bash
# Build Backend TypeScript to dist/
cd backend
npm run build

# Build Frontend React + Vite + PWA to dist/
cd frontend
npm run build
```

---

## 🔍 Troubleshooting Guide

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **`Database connection lost` / `503 Service Unavailable`** | PostgreSQL service is not running or credentials in `.env` are incorrect. | Ensure PostgreSQL is running (`Get-Service postgres*` or `sudo systemctl status postgresql`) and verify `DB_PASSWORD` in `backend/.env`. |
| **`Port 8080 already in use`** | Another application is bound to port 8080. | Change `PORT=8081` in `backend/.env` and update `VITE_API_URL=http://localhost:8081/api` in `frontend/.env`. |
| **`No mutations provided for synchronization`** | Outbox drawer is empty when sync is triggered. | Normal behavior when there are no queued offline changes. |
| **Photo upload shows Base64 URL** | AWS S3 credentials are not set in `backend/.env`. | Intended local demo fallback. Photos work 100% offline and online without requiring AWS credentials. |
| **IndexedDB shows stale cached data** | Previous user session or schema migration mismatch. | Open DevTools $\to$ Application $\to$ IndexedDB $\to$ Delete `fieldflow_fsm_db_*` or use the in-app **Reset Cache** button in the Outbox Drawer. |

---

## 🛡️ Security & Zero Committed Secrets Policy

This repository strictly adheres to secure credential management practices:
- **Zero Real Secrets Committed**: No live AWS credentials, private keys, or cloud database credentials exist in tracked files.
- **Safe Placeholders**: `.env.example` files contain only safe, self-describing placeholder values.
- **Pre-configured `.gitignore`**: All `.env` and `.env.*` files are ignored across root, backend, and frontend directories.
- *(Notice: Any credentials previously exposed during historical commits have been removed and must be rotated outside the repository).*
