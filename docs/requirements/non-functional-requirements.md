# Non-Functional Requirements — OKR360 V1

> Design status: TARGET V1
>
> Implementation status: NOT STARTED; no requirements measured yet

This document records quality requirements along with their verification methods. The **Status** column has two values:

- **Baseline:** values or behaviors already defined in existing documentation or source code; the Source column indicates where. Numbers like `01` or `05 §7.1` refer to the corresponding documents in `docs/`.
- **Proposed:** new values, established as initial baselines for an organization of 50–300 employees. May be adjusted prior to testing.

## Reference Load

All performance requirements are measured against the following dataset. This is a testing assumption, not production metrics.

| Parameter | Value | Status |
|---|---|---|
| User count | 300 | Baseline (01, upper bound of scale) |
| Objectives per user per cycle | 5 | Baseline (default `max_objectives_per_user`) |
| Key Results per Objective | 3 | Proposed |
| Archived check-ins | 8 cycles, 1 check-in per KR per week, 13 weeks per cycle | Proposed |
| Concurrent active users | 60 | Proposed |

## Performance

| ID | Requirement | Verification Method | Source | Status |
|---|---|---|---|---|
| NFR-PERF-001 | Paginated list read APIs: P95 ≤ 500 ms. | Load testing | — | Proposed |
| NFR-PERF-002 | Write APIs, including check-in and progress roll-up: P95 ≤ 800 ms. | Load testing | — | Proposed |
| NFR-PERF-003 | Read company-wide OKR tree: P95 ≤ 1 second. | Load testing | Code exists since 08; figure is proposed | Proposed |
| NFR-PERF-004 | Dashboards and reports: P95 ≤ 2 seconds. | Load testing | — | Proposed |
| NFR-PERF-005 | XLSX or PDF export completes within 10 seconds. | Load testing | — | Proposed |
| NFR-PERF-006 | UI usable immediately after check-in or saving Objective, without waiting for AI. | Integration testing with slow mock AI service | 04, BR-096 | Baseline |

## Reliability

| ID | Requirement | Verification Method | Source | Status |
|---|---|---|---|---|
| NFR-REL-001 | Original mutation and AI event are recorded within the same transaction. If mutation fails, no event remains; if mutation succeeds, event is guaranteed to exist. | Integration testing | 05 §7.1 | Baseline |
| NFR-REL-002 | Job retries or two workers picking up the same task do not produce duplicate results. | Integration testing | 05 §7.2, AC-UC30 | Baseline |
| NFR-REL-003 | Reminder job retries do not send duplicate notifications. | Integration testing | 05 §6 | Baseline |
| NFR-REL-004 | Disabling AI services keeps all non-AI features operational; AI blocks display "No analysis available". | Testing with failing mock AI service | 04, AC-UC27 | Baseline |
| NFR-REL-005 | Daily database backups, retain last 7 snapshots, and test restoration at least once prior to production rollout. | Restoration drill | — | Proposed |

## AI Automation

| ID | Requirement | Verification Method | Source | Status |
|---|---|---|---|---|
| NFR-AI-001 | Cross-department blockers routed to the assignee within 15 minutes of check-in. | End-to-end testing | 01 G7, AC-UC29 | Baseline |
| NFR-AI-002 | 1-on-1 draft ready within 1 hour after campaign closure. | End-to-end testing with a 300-user campaign | 01 G7, AC-UC31 | Baseline |
| NFR-AI-003 | 360 review comment guard returns results within 5 seconds; allow submission upon timeout. | Testing with slow mock AI service | UC19, AC-UC19 | Baseline |
| NFR-AI-004 | Background AI service calls time out at 30 seconds per invocation. | Testing with slow mock AI service | `aiPipeline.js` | Proposed |
| NFR-AI-005 | AI rate limits applied per flow on a daily basis. Recorded invocation count matches actual invocation count. | Integration testing | UC27, 05 §7.2 | Baseline |
| NFR-AI-006 | AI service calls abstracted behind a dedicated gateway interface to allow switching providers without modifying business logic. | Architecture review | — | Proposed |

## Security

| ID | Requirement | Verification Method | Source | Status |
|---|---|---|---|---|
| NFR-SEC-001 | JWT expires after 30 minutes. V1 has no refresh tokens. | API testing | UC01, 01 | Baseline |
| NFR-SEC-002 | New passwords must be at least 8 characters. | Boundary testing | UC03, AC-UC03 | Baseline |
| NFR-SEC-003 | Passwords stored as hashes only, using Argon2id (ADR-006). | Database review, testing | AC-UC01, `password_hash` | Baseline |
| NFR-SEC-004 | More than 5 failed attempts in 15 minutes for an account returns `429`. Invalid credentials and locked accounts return an identical `401` response. | API testing | AC-UC01 | Baseline |
| NFR-SEC-005 | All APIs except login authenticate and authorize at the backend. | Per-API authorization testing | BR-002 | Baseline |
| NFR-SEC-006 | All connections use HTTPS. | Deployment review | 01 §6 | Baseline |
| NFR-SEC-007 | AI service keys reside strictly in backend. Browser never invokes AI directly. | Code and frontend build review | `AiWorker.jsx` | Baseline |
| NFR-SEC-008 | Passwords, tokens, and secret keys never appear in logs or audit trails. | Log sample review | 05 §6 | Baseline |

## Anonymity and Privacy

| ID | Requirement | Verification Method | Source | Status |
|---|---|---|---|---|
| NFR-PRIV-001 | After campaign closure, even a user with full database read access cannot associate scores with reviewers. | Schema testing | 05 §3.1 | Baseline |
| NFR-PRIV-002 | All APIs, reports, exports, and audit logs do not contain reviewer-reviewee pairs for anonymous groups. | API testing, export review | BR-060 | Baseline |
| NFR-PRIV-003 | Comments are unattributed and not displayed in submission order. | API testing | `review.js` | Baseline |
| NFR-PRIV-004 | Content sent to AI services contains no full names, emails, or phone numbers; units appear as codes with an accompanying directory. | Record outgoing payloads in test environment | AC-UC32 | Baseline |
| NFR-PRIV-005 | Automation run history and event outbox do not contain content columns. | Schema testing | 05 §7.1, 05 §7.4 | Baseline |
| NFR-PRIV-006 | 360 review comment guard does not create run history records, ensuring execution timestamps cannot be used to deduce reviewer identity. | Schema testing | 05 §7.4 | Baseline |

## User Experience and Accessibility

| ID | Requirement | Verification Method | Source | Status |
|---|---|---|---|---|
| NFR-UX-001 | Fully usable on screens from 375 px wide. | UI testing | 04 | Baseline |
| NFR-UX-002 | Confidence level and progress not conveyed by color alone; always accompanied by text and percentage. | UI review | 04 | Baseline |
| NFR-UX-003 | Core features navigable via keyboard; modals trap Tab focus and close via `Escape`. | Keyboard testing | 04 | Baseline |
| NFR-UX-004 | All input fields have labels; icon-only buttons include accessible names for screen readers. | UI review | 04 | Baseline |
| NFR-UX-005 | Support the last two major versions of Chrome, Edge, and Firefox. | UI testing | — | Proposed |

## Operations

| ID | Requirement | Verification Method | Source | Status |
|---|---|---|---|---|
| NFR-OPS-001 | API errors use `ProblemDetails` format. UI displays only concise messages with tracking codes, omitting technical details. | API testing | 08, 04 | Baseline |
| NFR-OPS-002 | Admin and HR can view status, retry counts, execution duration, and errors for each automated run. | API testing | UC28, AC-UC28 | Baseline |
| NFR-OPS-003 | When closing a 360 campaign with numerous drafts to generate, tasks are processed asynchronously via a queue without degrading API responsiveness. | Load testing | 01 §6 | Baseline |

**Related:** [Business Rules](business-rules.md) · [Scope](../01-scope.md) · [Data Model](../05-data-model.md)