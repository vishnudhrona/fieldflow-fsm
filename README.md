## 🚀 Quick Start Guide

### 📋 Prerequisites
- **Node.js**: `v18.x` or higher
- **PostgreSQL**: `v14.x` or higher (Running locally or via Docker)
- **Package Manager**: `npm`

---

### 🔑 Demo Credentials

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin / Dispatcher** | `admin@example.com` | `admin123` | Create & manage customers/assets; dispatch work orders; cancel jobs; view company-wide activity history. |
| **Field Technician** | `tech@example.com` | `tech123` | View assigned jobs; execute checklists & readings offline; attach offline photos; complete jobs; manage outbox sync queue. |

> 💡 **Tip**: The login screen (`/login`) includes **1-Click Quick Demo Autofill** buttons to instantly test both roles.

---

## 💻 Local Setup & Execution

### 1. Backend Setup
```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## 2. evn
ACCESS_KEY_ID=AKIA4EPZFXCX7D6IW3YX
ACCESS_KEY=XNGW7rU8WADmARYlW5xYsysDQmnICxRG7ae+Q2Bv

### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

---

## 🏗️ Architecture & Documentation Suite

For comprehensive technical, architectural, and conflict-handling breakdowns, refer to our detailed documentation suite in [`/docs`](./docs):

- 📐 **[System Architecture & Data Model (docs/ARCHITECTURE.md)](./docs/ARCHITECTURE.md)**: Architecture diagrams, Dexie IndexedDB schemas, Mermaid ER diagrams, and answers to the 10 core architecture questions.
- ⚡ **[Conflict Resolution Strategy & Idempotency (docs/CONFLICT_RESOLUTION.md)](./docs/CONFLICT_RESOLUTION.md)**: Detailed breakdown of the `COMPLETED` vs `CANCELLED` conflict scenario and `X-Idempotency-Key` deduplication logic.
- 📡 **[API Specification Reference (docs/API_SPECIFICATION.md)](./docs/API_SPECIFICATION.md)**: Full REST API endpoint reference and `/api/sync/batch` contract.

---

## 🧪 7 Live Demonstration Scenarios

| # | Test Scenario | Resolution & Mechanism |
| :-: | :--- | :--- |
| **1** | **Online Work Order Lifecycle** | Admin dispatches job $\to$ Technician completes online with live updates. |
| **2** | **Offline Persistence & Restart** | Technician goes offline, adds notes/photos/readings, closes & reopens browser $\to$ data survives in Dexie IndexedDB. |
| **3** | **Automatic Outbox Sync** | Technician reconnects $\to$ `SyncContext` automatically pushes queued outbox items to `/api/sync/batch`. |
| **4** | **COMPLETED vs CANCELLED Conflict** | Job completed offline while Dispatcher cancels online $\to$ backend detects version mismatch, flags as `CONFLICT`, and displays in Outbox Drawer without silent data loss. |
| **5** | **Idempotent Retry Handling** | Sync request transmitted 3x due to network blips $\to$ backend checks `mutationId` / `X-Idempotency-Key` and processes exactly once. |
| **6** | **Offline Photo Survival & Retry** | Offline camera capture stored as `Blob` in IndexedDB, queued in `photoSyncEngine`, retries automatically on failure. |
| **7** | **Security & Role Authorization** | Technician attempts to access or modify unauthorized work orders $\to$ backend rejects with `403 Forbidden`. |
