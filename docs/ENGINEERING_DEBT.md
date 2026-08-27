# MMEMME Engineering Debt Register

Status: **Milestone 8 baseline**
Reviewed: 27 August 2026

Severity is based on launch impact: `critical` permits direct data/fund compromise;
`high` blocks a safe release; `medium` damages reliability or maintainability; `low`
is contained cleanup. Owners are `technical founder`, `operations founder`, or a
named external reviewer. Release disposition is `M8`, a later backlog item, an
external launch gate, or explicitly deferred.

## Release blockers and scheduled debt

| ID    | Severity | Finding                                                                                         | Owner                                            | Disposition                                                                                                                                   |
| ----- | -------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| D-001 | High     | Public web application did not exist.                                                           | Technical founder                                | Resolved in M8-02 foundation; full marketplace is M10–M11.                                                                                    |
| D-002 | High     | Database types were handwritten, partial, and mobile-only.                                      | Technical founder                                | Resolved in M8-03 with generated `packages/database` types and CI drift check.                                                                |
| D-003 | High     | Edge Functions accepted untyped JSON and returned inconsistent errors.                          | Technical founder                                | Shared schemas/error contract introduced in M8-03; all new transactional endpoints must use it. Existing endpoint migration continues in M15. |
| D-004 | High     | No CI, formatting, lint, SQL safety, boundary, secret, or schema-drift gate.                    | Technical founder                                | Resolved in M8-04.                                                                                                                            |
| D-005 | High     | Clients silently constructed a Supabase client with an invalid fallback URL.                    | Technical founder                                | Resolved in M8-05 with validated startup configuration and no fallback client.                                                                |
| D-006 | Critical | Demo payment endpoint could exist alongside production functions.                               | Technical founder                                | Production runtime guard and production deployment allowlist added in M8-05. M16 must verify deployed inventory.                              |
| D-007 | High     | Payment/legal/provider approval gates are incomplete.                                           | Operations founder + counsel/accountant/Paystack | External M18 launch gate; live payments remain false.                                                                                         |
| D-008 | High     | Dependency audit reported high advisories in Next/Expo transitive trees.                        | Technical founder                                | Patch compatible versions in M8; remaining upstream-only advisories block release unless zero high or documented vendor mitigation.           |
| D-009 | High     | No customer web parity, vendor onboarding, or production operations workflows.                  | Technical founder                                | Scheduled M10–M15; not represented as completed by the M8 shells.                                                                             |
| D-010 | High     | RLS, authorization, webhook, refund, payout, and concurrency cases lack full integration tests. | Technical founder                                | Scheduled M15–M17; unit-only evidence is insufficient for launch.                                                                             |
| D-011 | Medium   | Generated Expo export folders and TypeScript build metadata exist locally.                      | Technical founder                                | Already ignored; clean-checkout and secret checks prevent commit.                                                                             |
| D-012 | Medium   | Prototype has hard-coded demo dates, seed identities, and LAN-era documentation/config.         | Technical founder                                | LAN config removed in M8-05; deterministic seed data remains local-only by design. Real supply is M13/M18.                                    |
| D-013 | Medium   | Material `any` remains in booking management UI.                                                | Technical founder                                | Scheduled M12-04 when the mobile booking management surface is rebuilt against shared contracts. ESLint prevents new explicit `any`.          |
| D-014 | Medium   | Prototype palette conflicts with the approved brand system.                                     | Product/design owner                             | Scheduled M9-02 through M9-04; `DESIGN.md` is authoritative now.                                                                              |
| D-015 | Medium   | Notification delivery is best-effort and lacks receipt/error retry integration evidence.        | Technical founder                                | Scheduled M16-04 and M17 failure-path testing.                                                                                                |
| D-016 | Medium   | Backup restore, incident rehearsal, load and low-end device evidence do not exist.              | Technical + operations founders                  | Scheduled M16–M18; explicit release blockers.                                                                                                 |
| D-017 | Low      | Several admin action modules are compressed and hard to review.                                 | Technical founder                                | Reformat during M14/M15 edits; no behavior-only rewrite in M8.                                                                                |
| D-018 | Medium   | Expo's `xcode` toolchain currently carries a transitive `uuid` advisory.                        | Technical founder                                | Upstream has no compatible non-breaking fix; CI blocks high/critical advisories and M12/M17 must recheck before native release.               |

## Explicitly deferred, not forgotten

- Vendor native app, live calendars, automated matching, additional event categories,
  non-naira payments, and self-service payouts remain outside the MVP by product
  decision. They are not engineering debt.
- Full customer and vendor UI implementation is intentionally assigned to M10–M14.
  The M8 web shell proves workspace/build independence only.
- The local demo function remains available solely for local development. It is
  excluded from `scripts/deploy-functions.mjs`, rejects production at runtime, and
  must not appear in a production function inventory.

## Milestone 0–7 incomplete exit evidence

The prototype implements screens and database paths, but it does not yet prove:

- clean environment provisioning in development, staging, and production;
- production SMS, email, push, analytics, or Sentry configuration;
- complete physical-device accessibility and poor-network recovery;
- provider-approved managed settlement or reconciled live-money rehearsal;
- legal approval for cancellation, refunds, privacy, tax, invoice, and dispute terms;
- security, backup restoration, incident response, capacity, and store review gates.

These are mapped to M16–M18 and remain release blockers regardless of demo behavior.
