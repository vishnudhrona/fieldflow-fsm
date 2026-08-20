# 🗄️ Primary Database ER Diagram & Data Model Documentation

This document provides a full Entity-Relationship (ER) diagram and table-by-table schema documentation for the **FieldFlow Offline-First Field Service Management PostgreSQL Database (`fsm_db`)**.

---

## 1. Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ WORK_ORDERS : "assigned to (technician)"
    USERS ||--o{ WORK_ORDER_ATTACHMENTS : "uploaded by"
    USERS ||--o{ WORK_ORDER_NOTES : "authored by"
    USERS ||--o{ WORK_ORDER_READINGS : "recorded by"
    USERS ||--o{ WORK_ORDER_HISTORIES : "triggered by"

    CUSTOMERS ||--o{ ASSETS : "owns"
    CUSTOMERS ||--o{ WORK_ORDERS : "billed to"

    ASSETS ||--o{ WORK_ORDERS : "serviced in"

    WORK_ORDERS ||--o{ WORK_ORDER_CHECKLISTS : "contains tasks"
    WORK_ORDERS ||--o{ WORK_ORDER_ATTACHMENTS : "has photos"
    WORK_ORDERS ||--o{ WORK_ORDER_NOTES : "has notes"
    WORK_ORDERS ||--o{ WORK_ORDER_READINGS : "has readings"
    WORK_ORDERS ||--o{ WORK_ORDER_HISTORIES : "logs audit trail"

    USERS {
        uuid id PK
        string name
        string email UK
        string password
        string role
        timestamp created_at
    }

    CUSTOMERS {
        uuid id PK
        string name
        string contact_person
        string email
        string phone
        string address
        timestamp created_at
    }

    ASSETS {
        uuid id PK
        uuid customer_id FK
        string machine_name
        string machine_type
        string model_name
        string serial_number
        string image_url
        timestamp created_at
    }

    WORK_ORDERS {
        uuid id PK
        string order_number UK
        string title
        string description
        string status
        string priority
        integer version
        uuid customer_id FK
        uuid asset_id FK
        uuid technician_id FK
        timestamp scheduled_date
        timestamp completed_at
        timestamp created_at
    }

    WORK_ORDER_CHECKLISTS {
        uuid id PK
        uuid work_order_id FK
        string task_description
        boolean is_completed
        integer order_index
        timestamp completed_at
    }

    WORK_ORDER_ATTACHMENTS {
        uuid id PK
        uuid work_order_id FK
        uuid technician_id FK
        string file_name
        string file_url
        integer file_size
        string mime_type
        timestamp created_at
    }

    WORK_ORDER_NOTES {
        uuid id PK
        uuid work_order_id FK
        uuid user_id FK
        string content
        string type
        timestamp created_at
    }

    WORK_ORDER_READINGS {
        uuid id PK
        uuid work_order_id FK
        uuid user_id FK
        string metric
        string value
        string unit
        timestamp recorded_at
    }

    WORK_ORDER_HISTORIES {
        uuid id PK
        uuid work_order_id FK
        uuid user_id FK
        string action
        string description
        jsonb metadata
        timestamp created_at
    }
```

---

## 2. Table Specifications & Indexes

### 2.1 `users`
Stores user authentication profiles and RBAC system roles (`ADMIN_DISPATCHER`, `TECHNICIAN`).
- **Primary Key**: `id` (`UUID`)
- **Indexes**: `UNIQUE INDEX idx_users_email (email)`

### 2.2 `customers`
Stores client organization profiles and billing contacts.
- **Primary Key**: `id` (`UUID`)

### 2.3 `assets`
Stores customer equipment machinery details.
- **Primary Key**: `id` (`UUID`)
- **Foreign Keys**: `customer_id` -> `customers(id)` (`ON DELETE SET NULL`)

### 2.4 `work_orders`
Primary operational work order header entity with optimistic concurrency versioning (`version`).
- **Primary Key**: `id` (`UUID`)
- **Foreign Keys**:
  - `customer_id` -> `customers(id)` (`ON DELETE CASCADE`)
  - `asset_id` -> `assets(id)` (`ON DELETE CASCADE`)
  - `technician_id` -> `users(id)` (`ON DELETE SET NULL`)
- **Indexes**:
  - `UNIQUE INDEX idx_wo_order_number (order_number)`
  - `INDEX idx_wo_status (status)`
  - `INDEX idx_wo_technician (technician_id)`

### 2.5 `work_order_checklists`
Service checklist items assigned to a work order.
- **Primary Key**: `id` (`UUID`)
- **Foreign Keys**: `work_order_id` -> `work_orders(id)` (`ON DELETE CASCADE`)

### 2.6 `work_order_attachments`
Captured camera photos uploaded by technicians.
- **Primary Key**: `id` (`UUID`)
- **Foreign Keys**:
  - `work_order_id` -> `work_orders(id)` (`ON DELETE CASCADE`)
  - `technician_id` -> `users(id)` (`ON DELETE SET NULL`)

### 2.7 `work_order_notes`
Field notes and observation comments added by field technicians.
- **Primary Key**: `id` (`UUID`)
- **Foreign Keys**:
  - `work_order_id` -> `work_orders(id)` (`ON DELETE CASCADE`)
  - `user_id` -> `users(id)` (`ON DELETE CASCADE`)

### 2.8 `work_order_readings`
Structured numerical equipment service readings logged by technicians.
- **Primary Key**: `id` (`UUID`)
- **Foreign Keys**:
  - `work_order_id` -> `work_orders(id)` (`ON DELETE CASCADE`)
  - `user_id` -> `users(id)` (`ON DELETE SET NULL`)

### 2.9 `work_order_histories`
Immutable audit trail logging status changes, outbox sync operations, and system events.
- **Primary Key**: `id` (`UUID`)
- **Foreign Keys**:
  - `work_order_id` -> `work_orders(id)` (`ON DELETE CASCADE`)
  - `user_id` -> `users(id)` (`ON DELETE SET NULL`)
