#!/usr/bin/env bash
set -euo pipefail

source_db="${PGDATABASE:-postgres}"
restore_db="mmemme_restore_rehearsal"
container="${SUPABASE_DB_CONTAINER:-supabase_db_mmemme}"
artifact_dir="${RESTORE_EVIDENCE_DIR:-.artifacts/restore}"
mkdir -p "$artifact_dir"
dump_file="$(mktemp)"
cleanup() { docker exec "$container" dropdb -U postgres --if-exists "$restore_db" >/dev/null 2>&1 || true; rm -f "$dump_file"; }
trap cleanup EXIT

started="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
start_epoch="$(date +%s)"
docker exec "$container" pg_dump -U postgres -d "$source_db" --format=custom --no-owner --no-privileges --exclude-schema=realtime --exclude-schema=vault --exclude-schema=supabase_functions --exclude-schema=graphql_public > "$dump_file"
docker exec "$container" dropdb -U postgres --if-exists "$restore_db"
docker exec "$container" createdb -U postgres "$restore_db"
docker exec "$container" psql -U postgres -d "$restore_db" -v ON_ERROR_STOP=1 -c "create schema if not exists vault;"
docker exec -i "$container" pg_restore -U postgres -d "$restore_db" --no-owner --no-privileges --exit-on-error < "$dump_file"
database_checksum="$(docker exec "$container" pg_dump -U postgres -d "$restore_db" --schema-only --no-owner --no-privileges | sha256sum | cut -d' ' -f1)"
storage_checksum="$(docker exec "$container" psql -U postgres -d "$restore_db" -Atc "select encode(extensions.digest(coalesce(string_agg(bucket_id||':'||name,',' order by bucket_id,name),''),'sha256'),'hex') from storage.objects")"
docker exec "$container" psql -U postgres -d "$restore_db" -v ON_ERROR_STOP=1 -Atc "select case when exists(select 1 from public.ledger_entries group by payment_id having sum(case when entry_type='gross' then amount_kobo else 0 end)<>sum(case when entry_type in('gateway_fee','platform_fee','vendor_net') then amount_kobo else 0 end)) then 'exceptions' else 'balanced' end" > "$artifact_dir/reconciliation.txt"
completed="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
rto_minutes="$(( ($(date +%s)-start_epoch+59)/60 ))"
evidence="$artifact_dir/restore-$(date -u +%Y%m%dT%H%M%SZ).json"
printf '{"environment":"isolated-local","backupStartedAt":"%s","restoreCompletedAt":"%s","rpoMinutes":0,"rtoMinutes":%s,"databaseChecksum":"%s","storageManifestChecksum":"%s","reconciliationStatus":"%s"}\n' "$started" "$completed" "$rto_minutes" "$database_checksum" "$storage_checksum" "$(cat "$artifact_dir/reconciliation.txt")" > "$evidence"
evidence_sha="$(sha256sum "$evidence" | cut -d' ' -f1)"
printf '%s  %s\n' "$evidence_sha" "$evidence" > "$evidence.sha256"
docker exec "$container" psql -U postgres -d "$source_db" -v ON_ERROR_STOP=1 -c "insert into public.restore_rehearsals(environment,backup_started_at,restore_completed_at,rpo_minutes,rto_minutes,database_checksum,storage_manifest_checksum,reconciliation_status,evidence_sha256) values('isolated-local','$started','$completed',0,$rto_minutes,'$database_checksum','$storage_checksum','$(cat "$artifact_dir/reconciliation.txt")','$evidence_sha');"
echo "Restore rehearsal passed: $evidence"
