# FieldFlow: Offline-First Field Service Management (FSM)

FieldFlow is a production-grade, offline-first Field Service Management platform built using a unified monorepo architecture. 

It provides seamless workflows for central dispatchers and field technicians, featuring robust client-side storage, background synchronization, and conflict resolution.

## 📁 Repository Structure

*   `backend/` - Node.js Express server written in TypeScript, using Sequelize ORM with PostgreSQL.
*   `frontend/` - React Progressive Web App (PWA) built with Vite, TypeScript, and Tailwind CSS.
*   `docker-compose.yml` - Docker Compose configuration to spin up the entire application stack locally.

## 🚀 Local Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) (v22+ recommended)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for running via containerization)

### Option 1: Running with Docker Compose (Recommended)
From the root directory, run:
```bash
docker compose up --build
```
This builds both services and runs them.
*   Frontend: `http://localhost:80`
*   Backend: `http://localhost:8080`

### Option 2: Running Individually

#### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```

#### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🛠 Tech Stack
*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Workbox (PWA), IndexedDB (Dexie.js).
*   **Backend:** Node.js, Express, TypeScript, Sequelize (PostgreSQL), dotenv.
*   **Deployment & Ops:** Docker, Docker Compose.
