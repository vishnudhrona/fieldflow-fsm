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

---

## 5. Customer Management Endpoints

### `GET /api/customers`
Retrieves all customer records (Requires `ADMIN_DISPATCHER` role).

- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "customers": [
      {
        "id": "10000000-0000-4000-8000-000000000001",
        "name": "Acme Industrial Systems",
        "contactPerson": "Robert Sterling",
        "email": "contact@acmeindustrial.com",
        "phone": "312-555-0143",
        "address": "100 Industrial Pkwy, Chicago, IL"
      }
    ]
  }
  ```

### `POST /api/customers`
Creates a new customer record.

- **Request Body**:
  ```json
  {
    "name": "Apex Global Logistics",
    "contactPerson": "Marcus Vance",
    "email": "ops@apexlogistics.com",
    "phone": "214-555-0812",
    "address": "800 Freight Terminal Way, Dallas, TX"
  }
  ```

### `GET /api/customers/:id`
Fetches a single customer by ID along with their registered equipment assets.

### `PUT /api/customers/:id`
Updates an existing customer record.

---

## 6. Asset Management Endpoints

### `GET /api/assets/:id`
Retrieves detailed equipment asset information including model, serial number, equipment photos, and owning customer.

- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "asset": {
      "id": "20000000-0000-4000-8000-000000000001",
      "machineName": "Industrial Chiller Unit A",
      "machineType": "HVAC Cooling System",
      "modelName": "Trane Centravac CVHE-800",
      "serialNumber": "SN-CH-99412-X",
      "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758",
      "customer": { "name": "Acme Industrial Systems" }
    }
  }
  ```

### `POST /api/assets`
Creates a new equipment asset for a customer (Requires `ADMIN_DISPATCHER` role).

- **Request Body**:
  ```json
  {
    "customerId": "10000000-0000-4000-8000-000000000001",
    "machineName": "Emergency MRI Generator Array",
    "machineType": "Medical Backup Power",
    "modelName": "CAT 3516B Diesel Genset",
    "serialNumber": "SN-GEN-33109-M",
    "installationDate": "2023-01-20"
  }
  ```

### `PUT /api/assets/:id`
Updates equipment asset specification and image URLs.

### `DELETE /api/assets/:id`
Deletes or deactivates an equipment asset.
