# 4. Solution Strategy — OKR360 V1

How the main design choices serve the quality goals in [section 1](01-introduction-and-goals.md#12-quality-goals).

| Quality goal | Strategy | Where it is described |
|---|---|---|
| Anonymity | Separate "who must review whom" from "what score was given"; when a round closes, the link between answers and reviewers is removed. The anonymity threshold is applied in one service only. Nothing about who reviewed whom reaches the API, logs or exports | [Data model](../../05-data-model.md) §3, BR-058 to BR-061 |
| Correct figures | Rules live twice: in the database (constraints and triggers) and in the application services. Pure calculation code (`ScoreCalculator`, `ProgressRollup`) is unit tested | ADR-003, [class diagrams](../uml/class-diagrams.md) |
| AI never breaks the core | User actions only write an event in the same transaction; the Worker calls AI later. AI results go to separate tables | ADR-002, ADR-004, [AI flows](ai-flows.md) |
| Security | Every request passes `JwtAuthGuard`, `RolesGuard` and `AccessPolicy` in the backend; the UI only hides buttons | BR-002, [sequence diagrams](../uml/sequence-diagrams.md) |
| Maintainability | One NestJS codebase, two processes, three layers per module, dependency rules checked by a linter; every rule and acceptance criterion has a test ID | ADR-001, ADR-002, [folder structure](../../07-folder-structure.md), [test cases](../../test-cases.md) |

Technology choices in short:

| Concern | Choice |
|---|---|
| Frontend | React + Vite (existing prototype) |
| Backend | NestJS, TypeScript |
| Database access | Kysely, SQL schema as source of truth |
| Background work | Worker process reading an event outbox in PostgreSQL |
| AI | External language model behind an AI Gateway |
| Deployment | Docker Compose on one server |

Previous: [3. Context and scope](03-context-and-scope.md) · Next: [5. Building block view](05-building-block-view.md)
