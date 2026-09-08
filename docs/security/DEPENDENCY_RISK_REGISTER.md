# Dependency Risk Register

Owner: technical founder. Review: weekly Dependabot run and before every release.

| Recorded   | Package/risk                                                                           | Decision                                                                        | Compensating control                                                                                                                                              | Expires    |
| ---------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 2026-09-08 | 14 moderate transitive Expo advisories in `decode-uri-component` and build-time `uuid` | Accept temporarily; forced remediation downgrades Expo across breaking versions | Hosted checkout avoids card handling; MMEMME does not call the affected UUID buffer APIs; lockfile, weekly Dependabot and the high/critical CI gate remain active | 2026-10-08 |

High or critical exploitable findings block release. A lower-severity exception needs a named owner, evidence that the vulnerable path is unreachable or mitigated, and an expiry of no more than 30 days.
