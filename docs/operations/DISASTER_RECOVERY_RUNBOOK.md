# Disaster Recovery Runbook

Owners: technical founder (primary), operations founder (backup).

Objectives for closed beta: database RPO 24 hours with daily backups, upgraded to 15 minutes when PITR is enabled; RTO 4 hours. Storage metadata and private object inventory must be captured with every rehearsal.

1. Declare an incident and freeze payments, refunds, payouts and schema deploys.
2. Select a restore point before the fault. Restore into a new isolated staging project, never over production.
3. Verify migration version, row counts, storage manifest, checksums and RLS.
4. Run operations, transaction and security SQL suites and financial reconciliation.
5. Record start/end times, measured RPO/RTO, database and storage checksums, reconciliation result and evidence checksum in `restore_rehearsals`.
6. Obtain primary and backup owner approval before traffic cutover. Rotate credentials if compromise is possible.

Production launch remains blocked until Supabase backup/PITR is enabled and a production-like isolated restore meets these objectives.
