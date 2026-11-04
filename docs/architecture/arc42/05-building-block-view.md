# 5. Building Block View — OKR360 V1

The building blocks are drawn with the C4 model and UML, so this section is a map to them.

| Level | Building blocks | Document |
|---|---|---|
| 1 | Web App, API, Worker, Database | [C2 Container](../c4/02-container.md) |
| 2 | API modules: auth, organization, okr, reviews, results, system, automation, AI Gateway; Worker pipeline: outbox reader, scheduler, flow runner, flows, email | [C3 Component](../c4/03-component.md) |
| 3 | Controllers, services, repositories and Worker classes of each module | [Class diagrams](../uml/class-diagrams.md) |

Rules that hold across the blocks:

- Each module has three layers: `api`, `application`, `infrastructure`; `application` does not import the other two ([folder structure](../../07-folder-structure.md)).
- A module uses another module only through the services that module exports. For example, results get the 360 score from the reviews module and never read the answers table.
- All AI calls go through the AI Gateway (ADR-005).

Previous: [4. Solution strategy](04-solution-strategy.md) · Next: [6. Runtime view](06-runtime-view.md)
