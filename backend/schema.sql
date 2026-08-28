-- =========================================================================
-- FieldFlow-FSM Production PostgreSQL Schema
-- Dialect: PostgreSQL (14+)
-- =========================================================================

-- Enable UUID extension for UUIDv4 primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. ENUM Types
-- -------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE "enum_users_role" AS ENUM ('ADMIN_DISPATCHER', 'TECHNICIAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "enum_work_orders_status" AS ENUM ('NEW', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "enum_work_orders_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "enum_work_order_conflicts_status" AS ENUM ('PENDING', 'RESOLVED_ACCEPT_SERVER', 'RESOLVED_DISCARDED', 'RESOLVED_REAPPLIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -------------------------------------------------------------------------
-- 2. Users Table
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "enum_users_role" NOT NULL DEFAULT 'TECHNICIAN',
    "phone" VARCHAR(50),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 3. Customers Table
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "customers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "address" TEXT NOT NULL,
    "contact_person" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 4. Menus Table (RBAC Dynamic Navigation)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "menus" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(100) NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "icon" VARCHAR(100),
    "parent_id" UUID REFERENCES "menus"("id") ON DELETE CASCADE,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "roles" VARCHAR(50)[] NOT NULL DEFAULT '{"ADMIN_DISPATCHER", "TECHNICIAN"}',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 5. Assets Table
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "assets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "machine_name" VARCHAR(255) NOT NULL,
    "machine_type" VARCHAR(100) NOT NULL,
    "model_name" VARCHAR(100) NOT NULL,
    "customer_id" UUID REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "image_url" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 6. Work Orders Table (Optimistic Concurrency via `version`)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "work_orders" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_number" VARCHAR(50) NOT NULL UNIQUE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "customer_id" UUID NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "asset_id" UUID NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "technician_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "status" "enum_work_orders_status" NOT NULL DEFAULT 'NEW',
    "priority" "enum_work_orders_priority" NOT NULL DEFAULT 'MEDIUM',
    "scheduled_date" DATE NOT NULL,
    "scheduled_time" VARCHAR(20),
    "completed_at" TIMESTAMP WITH TIME ZONE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 7. Work Order Checklists Table
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "work_order_checklists" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "work_order_id" UUID NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "task_description" VARCHAR(255) NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT FALSE,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 8. Work Order Attachments Table (Idempotent Photo Sync)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "work_order_attachments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "work_order_id" UUID NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "technician_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "file_url" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" INTEGER,
    "mime_type" VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
    "client_local_id" VARCHAR(255),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 9. Work Order Notes Table
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "work_order_notes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "work_order_id" UUID NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "content" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'NOTE',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 10. Work Order Histories Table (Audit Trail)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "work_order_histories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "work_order_id" UUID NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "action" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 11. Work Order Readings Table (Telemetry & Pressure/Temp Readings)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "work_order_readings" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "work_order_id" UUID NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "metric" VARCHAR(100) NOT NULL,
    "value" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 12. Sync Operations Table (Distributed Batch Idempotency Ledger)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "sync_operations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "actor_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "mutation_id" VARCHAR(255) NOT NULL,
    "work_order_id" UUID,
    "operation_type" VARCHAR(100) NOT NULL,
    "request_hash" VARCHAR(64) NOT NULL,
    "state" VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    "response_payload" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP WITH TIME ZONE
);

-- -------------------------------------------------------------------------
-- 13. Work Order Conflicts Table (Server-side Conflict Auditing)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "work_order_conflicts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "mutation_id" VARCHAR(255) NOT NULL,
    "work_order_id" UUID NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
    "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "local_payload" JSONB NOT NULL,
    "base_version" INTEGER,
    "server_version" INTEGER,
    "server_snapshot" JSONB,
    "reason" TEXT NOT NULL,
    "status" "enum_work_order_conflicts_status" NOT NULL DEFAULT 'PENDING',
    "resolved_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "resolution" TEXT,
    "resolved_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 14. Performance Indexes & Partial Constraints
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_work_orders_technician_status" ON "work_orders" ("technician_id", "status");
CREATE INDEX IF NOT EXISTS "idx_work_orders_scheduled_date" ON "work_orders" ("scheduled_date");
CREATE INDEX IF NOT EXISTS "idx_work_orders_customer_id" ON "work_orders" ("customer_id");
CREATE INDEX IF NOT EXISTS "idx_work_orders_asset_id" ON "work_orders" ("asset_id");
CREATE INDEX IF NOT EXISTS "idx_work_order_checklists_work_order_id" ON "work_order_checklists" ("work_order_id");
CREATE INDEX IF NOT EXISTS "idx_work_order_notes_work_order_id" ON "work_order_notes" ("work_order_id");
CREATE INDEX IF NOT EXISTS "idx_work_order_readings_work_order_id" ON "work_order_readings" ("work_order_id");
CREATE INDEX IF NOT EXISTS "idx_work_order_histories_work_order_id" ON "work_order_histories" ("work_order_id");

-- Idempotency Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "sync_operations_actor_mutation_unique" 
    ON "sync_operations" ("actor_id", "mutation_id");

CREATE UNIQUE INDEX IF NOT EXISTS "work_order_attachments_wo_client_local_id_unique" 
    ON "work_order_attachments" ("work_order_id", "client_local_id") 
    WHERE "client_local_id" IS NOT NULL;
