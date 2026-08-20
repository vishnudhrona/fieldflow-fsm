# 📡 API Specification & Reference

This document provides a full REST API specification for the **Offline-First Field Service Management Backend**.

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT bearer token.

- **Request Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "admin123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": "00000000-0000-4000-8000-000000000002",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN_DISPATCHER"
    }
  }
  ```

---

## 2. Synchronization Endpoint (Core Outbox Contract)

### `POST /api/sync/batch`
Processes an array of offline mutations generated while the technician was disconnected.

- **Headers**:
  - `Authorization`: `Bearer <token>`
  - `X-Idempotency-Key`: `<batch_id_or_mutation_id>`
- **Request Body**:
  ```json
  {
    "mutations": [
      {
        "mutationId": "mut_1787195000_abc123",
        "workOrderId": "4a34fa9b-975c-4581-8813-2c81cfef9a99",
        "actionType": "UPDATE_STATUS",
        "payload": { "status": "COMPLETED" },
        "timestamp": 1787195000000
      },
      {
        "mutationId": "mut_1787195005_def456",
        "workOrderId": "4a34fa9b-975c-4581-8813-2c81cfef9a99",
        "actionType": "ADD_NOTE",
        "payload": { "content": "Completed annual pump filter replacement." },
        "timestamp": 1787195005000
      }
    ]
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "results": [
      {
        "mutationId": "mut_1787195000_abc123",
        "status": "SYNCED",
        "currentVersion": 2
      },
      {
        "mutationId": "mut_1787195005_def456",
        "status": "SYNCED"
      }
    ]
  }
  ```
- **Response `200 OK (With Conflict Detected)`**:
  ```json
  {
    "success": true,
    "results": [
      {
        "mutationId": "mut_1787195000_abc123",
        "status": "CONFLICT",
        "errorMessage": "Conflict: Work order WO-1001 was CANCELLED by dispatcher while offline."
      }
    ]
  }
  ```

---

## 3. Work Order Endpoints

### `GET /api/work-orders`
Retrieves work orders. Admins receive all company work orders; Technicians receive only their assigned jobs.

- **Query Parameters**:
  - `status`: Filter by status (`NEW`, `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
  - `search`: Search by order number, title, customer, or asset machine name.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "workOrders": [
      {
        "id": "4a34fa9b-975c-4581-8813-2c81cfef9a99",
        "orderNumber": "WO-1001",
        "title": "Quarterly HVAC Inspection",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "customer": { "name": "Acme Corp" },
        "asset": { "machineName": "Chiller Unit A" }
      }
    ]
  }
  ```

### `GET /api/work-orders/:id`
Fetch single work order details including checklist items, readings, field notes, attachments, and history.

---

## 4. Attachment Endpoint

### `POST /api/work-orders/:id/attachments`
Uploads a binary photo attachment captured offline.

- **Headers**:
  - `Content-Type`: `multipart/form-data`
  - `X-Idempotency-Key`: `<client_photo_id>`
- **Form Fields**:
  - `file`: Image binary (`capture.jpg`)
  - `client_local_id`: Local Dexie attachment ID
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "attachment": {
      "id": "att_987123",
      "workOrderId": "4a34fa9b-975c-4581-8813-2c81cfef9a99",
      "fileUrl": "/uploads/1787195000-capture.jpg"
    }
  }
  ```
