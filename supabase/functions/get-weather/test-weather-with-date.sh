#!/bin/bash
set -e

export SUPABASE_URL="https://qxlcgekggsojggybchcz.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4bGNnZWtnZ3NvamdneWJjaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzMxMDgsImV4cCI6MjA3NDY0OTEwOH0._pIFhLOJuS2zG43JhGiolGb0p0l1pwNZsrw39HbNAaE"

echo "Calling get-weather..."
URL="${SUPABASE_URL}/functions/v1/get-weather"
echo "URL: $URL"

RESP=$(curl -sS -w "\n%{http_code}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"lat\":37.7749,\"lon\":-122.4194,\"date\":\"2025-09-20\"}" \
  "$URL")

BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -n1)

echo "HTTP Status: $CODE"
echo "Response:"
echo "$BODY" | jq '.'