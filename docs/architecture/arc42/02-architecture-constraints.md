# 2. Architecture Constraints — OKR360 V1

Constraints are fixed conditions the design must accept; they are not choices made by the architecture.

## 2.1 Technical constraints

| Constraint | Source |
|---|---|
| Frontend is the existing React + Vite prototype | [Frontend README](../../../src/frontend/README.md) |
| Backend uses NestJS with TypeScript | ADR-001 |
| Database is PostgreSQL 15+ | [Data model](../../05-data-model.md) |
| The API contract is OpenAPI 3.0; errors use Problem Details | [API](../../api/README.md) |
| The AI service is an external language model reached over HTTPS; the provider is not chosen yet | ADR-005 |
| The web UI must work from a 375 px wide screen; no native mobile app | NFR-UX-001, [scope](../../01-scope.md) |

## 2.2 Organizational constraints

| Constraint | Consequence |
|---|---|
| Personal project, one developer | Prefer one codebase and few moving parts (ADR-002, ADR-004) |
| One company per installation, no multi-tenancy | No tenant isolation in data or code |
| No SSO, no two-factor authentication, no refresh token in V1 | Login is email and password with a 30-minute JWT (ADR-006) |
| AI may read, classify, summarize, warn and draft; it may never score, grade or change data | Every AI result goes to its own tables and is labelled "AI generated" (BR-090, BR-091) |
| Content sent to others is always a draft approved by a person | 1-on-1 summaries pass through a reviewer (BR-092) |

## 2.3 Conventions

- UI text is Vietnamese; documentation and code are English.
- Names in code follow the contract: controller methods equal `operationId`, DTOs equal OpenAPI schema names ([folder structure](../../07-folder-structure.md)).
- Dates use `YYYY-MM-DD`, times ISO 8601; the UI shows `dd/MM/yyyy`.

Previous: [1. Introduction and goals](01-introduction-and-goals.md) · Next: [3. Context and scope](03-context-and-scope.md)
