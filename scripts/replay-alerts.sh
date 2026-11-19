#!/usr/bin/env bash
# Stands in for rwatch until its HTTP emitter exists: POSTs each line of a
# JSON Lines file to the ingestion endpoint and prints the HTTP status code.
#
# Usage:
#   JETON=<token> URL=http://127.0.0.1:8080/api/alerts ./scripts/replay-alerts.sh [file]
set -euo pipefail

: "${JETON:?set JETON to the ingestion token}"
: "${URL:?set URL to the ingestion endpoint}"
FILE="${1:-fixtures/exemples-alertes.jsonl}"

while IFS= read -r line; do
  [ -z "$line" ] && continue
  curl -s -o /dev/null -w '%{http_code}\n' -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JETON" \
    -d "$line" "$URL"
done < "$FILE"