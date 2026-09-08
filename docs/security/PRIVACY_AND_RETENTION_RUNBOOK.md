# Privacy and Retention Runbook

Customer exports and deletions begin at `/account/privacy`; operators work them at `/privacy`. Identity must be confirmed through the authenticated session. Never email an export as an attachment. Complete within 30 days or the queue is overdue.

Deletion removes drafts, shortlist entries, push tokens and preferences; anonymizes product events and the profile; and retains pseudonymized bookings, payments, ledger, refunds, payouts and audit records. An operator must record a reason. Auth-user removal follows only after the database workflow succeeds and the retained-record review is complete.

The scheduled retention task deletes drafts after 30 days and notifications after 365 days, anonymizes analytics after 180 days and removes expired rate-limit counters. Vendor evidence is deleted after its approved verification/dispute window. Financial and audit retention requires counsel/accounting approval before production.

Exports exclude administrator flags and raw provider status. Analytics must never include free text, names, email, phone, object paths, payment references, NIN/BVN values or message bodies. Consent history is append-only.
