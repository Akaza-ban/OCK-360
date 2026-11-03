# Implementation and Testing Plan — OKR360 V1

> Design status: TARGET V1
>
> Implementation status: NOT STARTED; the backend does not exist, and the frontend is a prototype using mock data

This document turns the design into a working order: what to do first, what counts as done, and how to test. The detailed test list is in the [test catalog](test-cases.md); test codes are attached to the [traceability matrix](traceability.md).

## 1. Source of truth when documents conflict

When two documents disagree, follow the priority order below, then fix the lower-priority document before writing code:

1. [Architecture decisions](architecture/decisions.md).
2. [Business rules](requirements/business-rules.md) and [acceptance criteria](06-acceptance-criteria.md).
3. [C4 architecture](architecture/c4.md) and [AI flow specification](architecture/ai-flows.md).
4. [OpenAPI](api/openapi.yaml) and [database schema](../src/database/okr360.sql).
5. [Class diagrams](architecture/class-diagrams.md), [sequence diagrams](architecture/sequence-diagrams.md), [folder structure](07-folder-structure.md).

Do not write code that works around a conflict; fix the documents and OpenAPI at the same time.

## 2. Implementation phases

The OKR and 360 core is built first and the AI part afterwards, because the AI only reads data that the core produces. Each phase ends in a runnable state with all of the phase's tests passing.

| Phase | Scope | Stories | Done when |
|---|---|---|---|
| I1 Foundation | NestJS project with `main.api.ts` and `main.worker.ts`; read and validate configuration; Kysely with types generated from the database; `ProblemDetailsFilter`; `compose.yaml` for PostgreSQL; CI running lint, `dependency-cruiser` and `schema_checks.sql` | — | API and Worker start; a missing environment variable stops startup with a clear message; the 67 schema tests pass in CI |
| I2 Login, authorization | `AuthController`, `TokenService`, Argon2id, failed-login limiting; `JwtAuthGuard`, `RolesGuard`, `AccessPolicy`; profile | US01, US02, US03 | UC01–UC03 tests pass; every operation except `login` returns `401` when the token is missing |
| I3 Organization | Departments, teams, users, directory | US04, US05 | UC04–UC05 tests pass |
| I4 Cycles and OKR | Cycles, Objectives, Key Results, links, soft delete, `ProgressRollup` | US06–US11 | UC06–UC11 tests pass; progress matches `okr.js` on the demo data |
| I5 Check-in | Check-in, roll-up, history, comments | US12, US13, US14 | UC12–UC14 tests pass; the `CHECKIN_CREATED` event is recorded |
| I6 360 review | Form templates, campaigns, nominations, approval, forms, closing a campaign, results with the anonymity threshold | US15–US21 | UC15–UC21 tests pass, except the comment-warning part; the post-closing anonymity test passes |
| I7 Final results | Consolidation, file export, publishing | US22a, US22b | UC22 tests pass; scores match hand-calculated figures on the demo data |
| I8 Dashboard, reports, notifications, audit log | Three dashboards, reports and file export, reminders and email in the Worker, audit log | US23a, US23b, US23c, US24, US25, US26 | UC23–UC26 tests pass; dashboards match reports with the same filters |
| I9 AI foundation | Event outbox, `FlowRunner`, `AiGateway`, `Masker`, `OutputValidator`, `FakeAiProvider`, quotas, retries, configuration and run history | US32a, US32b, US32c, US27, US28 | UC27, UC28 and the shared part of UC32 tests pass, running with `FakeAiProvider` |
| I10 AI flows | Blocker routing, mismatch detection, OKR review, weekly digest, 1-1 draft, comment warning | US29, US30, US31, US33, US34 | UC29–UC31 tests, plus the AI parts of UC19 and UC32, pass; the real AI service is chosen and connected |
| I11 Frontend integration | Replace mock data with `features/*/api.js` feature by feature, keeping `VITE_USE_MOCK` for demos | — | Every screen runs against the real API; the UI states in [information architecture](04-information-architecture.md) still hold |

The real AI service only needs to be chosen in I10. Through I9, every AI test runs with `FakeAiProvider` (ADR-005).

## 3. Splitting stories that are too large

The three stories that do not meet the Small criterion in the [INVEST assessment](08-invest-requirements.md) are split as follows. Sub-story codes are used in this plan; the traceability matrix still follows the original stories.

| Original story | Sub-story | Content | Phase |
|---|---|---|---|
| US22 | US22a | Consolidate OKR, 360, final scores and grades; re-consolidate before publishing | I7 |
| | US22b | File export, publishing, per-person notification | I7 |
| US23 | US23a | Personal dashboard | I8 |
| | US23b | Team dashboard | I8 |
| | US23c | Company dashboard | I8 |
| US32 | US32a | Event outbox, reading with `SKIP LOCKED`, `FlowRunner`, recording run history | I9 |
| | US32b | `AiGateway`: replace names with codes, call the service, validate the schema | I9 |
| | US32c | Retry after 1, 5, 15 minutes; duplicate-run prevention; quotas | I9 |

## 4. Testing strategy

| Level | What is tested | Suggested tools | Runs at |
|---|---|---|---|
| UNIT | Pure code needing no database: `ScoreCalculator`, `ProgressRollup`, `AnonymityAggregator`, `Masker`, `OutputValidator` | Jest | Every commit |
| INT | Repositories against a real PostgreSQL: constraints, triggers, views, transactions, `schema_checks.sql` | Jest, PostgreSQL in Docker | Every commit |
| API | Each operation over HTTP: permissions (`401`, `403`, allowed), invalid data (`400`), state (`409`), responses matching OpenAPI | Jest, Supertest, an OpenAPI response validator | Every commit |
| AI | AI flows with `FakeAiProvider`: errors, timeouts, wrong schema, "ignore the instructions"-style sentences, outgoing content containing no real names | Jest | Every commit |
| SEC, PRIV | No leakage of passwords, tokens, or anonymous reviewers through the API, logs, or export files | Jest, review | Every phase |
| PERF | Response time under the reference load | k6 | Before going live |
| E2E | The demo scenario in the README runs on the real UI | Manual or Playwright | From I11 |

Test code conventions:

- `TC-UCxx-nn`: one bullet in the acceptance criteria AC-UCxx, in the same order as in the document.
- `TC-NFR-...`: one non-functional requirement, with the same code as the requirement.

When acceptance criteria change, regenerate the test catalog so that test codes always match.

## 5. Definition of done

### 5.1 Each API operation

- Path, method, parameters, input and output match [OpenAPI](api/openapi.yaml), with no fields outside the contract; the controller function name equals the `operationId`.
- Tests exist for: missing token (`401`), wrong role or wrong data scope (`403`), each role allowed in `x-roles`, invalid data (`400` with `errors`), and every `409` error in the contract.
- Every rule in `x-business-rules` has at least one test.
- Errors are returned as `application/problem+json` with `errorCode` and `traceId`.
- Write operations record an audit log entry when the use case requires it; the log contains no passwords, tokens, scores, comments or anonymous reviewer pairs.
- Tests run against a real PostgreSQL, with no mocked repository at the API level.

### 5.2 Each phase

- All tests in the [test catalog](test-cases.md) for the phase's use cases pass.
- CI is green: lint, `dependency-cruiser`, unit, integration, API, `schema_checks.sql`.
- No rule is worked around in code; conflicts have been fixed in the documents.
- The [traceability matrix](traceability.md) and the README are updated if the design changes.

### 5.3 Before going live

- All `TC-NFR-PERF-*` and `TC-NFR-SEC-*` tests pass under the reference load.
- A restore-from-backup drill has been performed (NFR-REL-005).
- The AI service has been chosen and tested to confirm outgoing content contains no real names, emails or phone numbers (NFR-PRIV-004).

## 6. Environments

| Environment | Includes | Used for |
|---|---|---|
| Development machine | `compose.yaml`: PostgreSQL; API and Worker run with `npm run start:dev`; `FakeAiProvider` | Writing code, running tests |
| CI | GitHub Actions with PostgreSQL as a service container; loads `okr360.sql` and `seed_demo.sql` before tests | Every push and pull request |
| Production | Docker Compose behind an HTTPS reverse proxy (ADR-007); real AI service | After I10 |

**Related:** [Test catalog](test-cases.md) · [Traceability matrix](traceability.md) · [Folder structure](07-folder-structure.md) · [Architecture decisions](architecture/decisions.md)
