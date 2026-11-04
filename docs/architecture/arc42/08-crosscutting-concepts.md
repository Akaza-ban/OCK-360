# 8. Cross-cutting Concepts — OKR360 V1

Concepts that apply to many modules at once. Each one is implemented in one place and reused.

## 8.1 Authentication and authorization

- Login returns a 30-minute JWT; there is no refresh token (ADR-006, NFR-SEC-001).
- Every request except `login` passes `JwtAuthGuard` and `RolesGuard`; data scope is checked by `AccessPolicy`: direct reports, units a manager is in charge of, ownership (BR-002, BR-003).
- 360 rounds use the reporting-line snapshot taken when form collection opens (BR-055).

## 8.2 Errors

- Every error is `application/problem+json` with `errorCode` and `traceId`; the UI shows only a short message and the `traceId` as a lookup code (NFR-OPS-001).
- Codes: `400` invalid data with field errors, `401` no or bad token, `403` no permission, `404` not found or soft-deleted, `409` wrong state, `429` too many failed logins ([API](../../api/README.md)).

## 8.3 Transactions and consistency

- A user action and its side effects, such as progress roll-up, the event for AI and the audit log, are written in one transaction (BR-043, NFR-REL-001).
- AI is called outside any transaction; its result is written in a new one ([data model](../../05-data-model.md) §4).
- Check-ins and audit logs are append-only; mistakes are fixed by adding a new record (BR-041, BR-083).

## 8.4 Audit and logging

- Important changes write `audit_logs` through `AuditLogService`.
- Logs and audit records never contain passwords, tokens, secrets, review scores, review comments or the reviewer–reviewee pair of an anonymous group (BR-083, NFR-SEC-008).

## 8.5 Privacy and anonymity

- Answers are separated from reviewers when a round closes; groups under 3 forms are merged or hidden; comments are shown without names and not in submission order (BR-058 to BR-062).
- Data sent to AI has names replaced by codes and never contains email, phone numbers, scores or reviewer identities (BR-093, BR-094).

## 8.6 AI automation

AI is not a separate feature. It runs behind existing actions (check-in, saving an Objective, closing a round, submitting a form) and on schedule, and its results appear on the screens where people already work. All six flows share one pipeline: trigger, quota, deduplication, name masking, AI call, schema validation, action, run history. The pipeline and each flow's data, JSON schema and action are specified in the [AI flow specification](ai-flows.md).

## 8.7 Validation and formats

- Request bodies are validated against the OpenAPI schemas; the database blocks invalid data again with constraints and triggers.
- Progress is stored as 0–1 and shown as a whole percentage; scores are shown with 2 decimals; dates are shown as `dd/MM/yyyy`.

Previous: [7. Deployment view](07-deployment-view.md) · Next: [9. Architecture decisions](09-architecture-decisions.md)
