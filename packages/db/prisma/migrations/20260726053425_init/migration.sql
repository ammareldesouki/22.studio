-- Baseline migration (empty schema — no domain tables, FR-014/FR-020)
-- DB-level prerequisites only.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";