# Architecture Decisions — OKR360 V1

> Design status: TARGET V1

Each decision records the reason and the price to pay, so that later it is clear what can change. Status **Decided** means the decision already came from the project owner or the existing design. **Proposed** is a new choice made at the architecture step, valid until replaced.

| ID                                                                     | Decision                                           | Status   |
| ---------------------------------------------------------------------- | -------------------------------------------------- | -------- |
| [ADR-001](#adr-001--backend-uses-nestjs)                               | Backend uses NestJS                                | Decided  |
| [ADR-002](#adr-002--one-codebase-two-processes)                        | One codebase, two processes: API and Worker        | Proposed |
| [ADR-003](#adr-003--database-keeps-the-rules-and-queries-with-kysely)  | Database keeps the rules, queries with Kysely      | Proposed |
| [ADR-004](#adr-004--event-outbox-in-postgresql-no-redis)               | Event outbox in PostgreSQL, no Redis               | Proposed |
| [ADR-005](#adr-005--call-ai-through-a-dedicated-gateway)               | Call AI through a dedicated gateway                | Proposed |
| [ADR-006](#adr-006--login-with-a-30-minute-jwt-and-argon2id)           | Login with a 30-minute JWT and Argon2id            | Proposed |
| [ADR-007](#adr-007--v1-runs-on-docker-compose)                         | V1 runs on Docker Compose                          | Proposed |

## ADR-001 — Backend uses NestJS

- **Context:** the frontend and the data generation tools both use JavaScript.
- **Decision:** the backend uses NestJS with TypeScript.
- **Reason:** one language family for the whole project; NestJS ships with modules, dependency injection and guards, which fit the three-layer architecture.
- **Cost:** NestJS does not separate layers by itself; the boundaries between API, Application and Infrastructure must be kept through folder structure and import rules.

## ADR-002 — One codebase, two processes

- **Context:** an AI call can take up to 30 seconds and be retried many times, while check-in must respond immediately (BR-096).
- **Decision:** the API and the Worker share one NestJS codebase and run as two separate processes. V1 does not split into microservices.
- **Reason:** a failing or slow Worker does not affect the API, while there is still only one project to maintain.
- **Cost:** two processes must be deployed; shared code must avoid depending on HTTP.

## ADR-003 — Database keeps the rules and queries with Kysely

- **Context:** the [database design](../../DATABASE.md) relies on triggers, views, recursive CTEs and conditional unique indexes to enforce the rules.
- **Decision:** a hand-written SQL schema, built in increment I1 from the database design, is the source of truth. The backend queries with Kysely, with TypeScript types generated from the database. No ORM that auto-creates migrations.
- **Reason:** Kysely can express full SQL (`FOR UPDATE SKIP LOCKED`, CTEs, views) while still type-checking. An ORM easily generates a schema that drifts from the tested triggers.
- **Cost:** more queries to write than with an ORM; an additional tool is needed to run SQL migrations.

## ADR-004 — Event outbox in PostgreSQL, no Redis

- **Context:** events must be written in the same transaction as the original operation (NFR-REL-001), and the system serves at most 300 people.
- **Decision:** the Worker polls `domain_events` periodically using `FOR UPDATE SKIP LOCKED`, every 30 seconds by default. The scheduler runs inside the Worker. V1 adds no Redis or dedicated queue.
- **Reason:** guarantees no event is lost without adding an operational component. A 30-second latency still meets the 15-minute target (NFR-AI-001). `UNIQUE (flow, run_key)` prevents duplicate runs even with multiple Workers.
- **Cost:** there is latency from periodic polling, and the database receives one additional periodic query. If load grows a lot, switch to a dedicated queue.

## ADR-005 — Call AI through a dedicated gateway

- **Context:** no AI service has been chosen yet, and all content must be replaced with codes (pseudonymized) before sending (BR-093).
- **Decision:** every AI call goes through the AI Gateway, which covers pseudonymization, calling the service and mapping codes back to names. Business logic knows only one common interface. The test environment uses a fake that records the content sent out.
- **Reason:** switching providers requires no business logic changes (NFR-AI-006), no flow can forget to pseudonymize, and NFR-PRIV-004 can be tested.
- **Cost:** one more abstraction layer; few provider-specific features can be used.

## ADR-006 — Login with a 30-minute JWT and Argon2id

- **Context:** the V1 scope has fixed JWT, no refresh token, no SSO.
- **Decision:** the access token expires after 30 minutes and is sent via the `Authorization: Bearer` header. Passwords are hashed with Argon2id. Permissions are re-read from the database on every request that needs a reporting-relationship check.
- **Reason:** simple and within scope. Reading the reporting relationship from the database makes a manager change take effect immediately, without waiting for the token to expire.
- **Cost:** users must log in again after 30 minutes; a token cannot be revoked before expiry. Disabling an account requires an extra database check to take effect immediately.

## ADR-007 — V1 runs on Docker Compose

- **Context:** the system is used internally by one company, at most 300 people.
- **Decision:** the Web App, API, Worker and PostgreSQL run with Docker Compose on one server, behind a reverse proxy that handles HTTPS.
- **Reason:** enough for the V1 scale, easy to recreate on a development machine.
- **Cost:** there is a single point of failure, so backups are needed (NFR-REL-005). No auto-scaling or zero-downtime updates yet.

**Related:** [C4 Architecture](../c4/README.md) · [Non-functional Requirements](../../requirements/non-functional-requirements.md)
