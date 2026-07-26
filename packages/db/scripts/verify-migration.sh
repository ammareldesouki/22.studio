#!/usr/bin/env bash
set -euo pipefail

# US3 integration check (SC-005, T027):
# Applies the baseline migration against a throwaway DB, then re-runs
# to prove idempotency ("already up to date" / "No pending migrations").
#
# Usage: DATABASE_URL=postgresql://... ./scripts/verify-migration.sh
# If DATABASE_URL is not set, uses a local throwaway DB named studioflow_test.

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

# Prisma CLI (run from packages/db) does not auto-load the repo-root .env — load it here so
# local runs pick up DATABASE_URL/DIRECT_URL. In CI these come from the job env and no .env exists.
ROOT_ENV="$SCRIPT_DIR/../../.env"
if [ -f "$ROOT_ENV" ]; then set -a; . "$ROOT_ENV"; set +a; fi

if [ -z "${DATABASE_URL:-}" ]; then
  THROWAWAY_DB="studioflow_verify_$$"
  echo "Creating throwaway database: $THROWAWAY_DB"
  createdb "$THROWAWAY_DB" 2>/dev/null || { echo "Failed to create DB — is Postgres running?" >&2; exit 1; }
  CLEANUP="true"
  export DATABASE_URL="postgresql://$(whoami)@localhost:5432/${THROWAWAY_DB}"
else
  CLEANUP="false"
fi

cleanup() {
  if [ "$CLEANUP" = "true" ] && [ -n "${THROWAWAY_DB:-}" ]; then
    echo "Dropping throwaway database: $THROWAWAY_DB"
    dropdb --if-exists "$THROWAWAY_DB" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "=== Applying baseline migration (first run) ==="
pnpm exec prisma migrate deploy 2>&1

echo ""
echo "=== Verifying idempotency (second run — should be no-op) ==="
OUTPUT=$(pnpm exec prisma migrate deploy 2>&1)
echo "$OUTPUT"

# Idempotent iff the second deploy applied nothing. Prisma prints "Applying migration"
# only when it actually runs one — assert that phrase is ABSENT (robust to no-op wording changes).
if echo "$OUTPUT" | grep -qi "Applying migration"; then
  echo ""
  echo "✗ FAIL: second deploy applied a migration — not idempotent" >&2
  exit 1
fi
echo ""
echo "✓ PASS: second deploy applied nothing — migration is idempotent"
