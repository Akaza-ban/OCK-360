# arc42 Architecture Documentation — OKR360 V1

The architecture is documented with the 12 sections of the [arc42](https://arc42.org) template. Where a topic is already covered by another document, the section summarizes it and links there instead of repeating it.

| # | Section | Main source |
|---|---|---|
| 1 | [Introduction and goals](01-introduction-and-goals.md) | [Scope](../../01-scope.md) |
| 2 | [Architecture constraints](02-architecture-constraints.md) | This section |
| 3 | [Context and scope](03-context-and-scope.md) | [C1 System Context](../c4/01-system-context.md) |
| 4 | [Solution strategy](04-solution-strategy.md) | This section |
| 5 | [Building block view](05-building-block-view.md) | [C2](../c4/02-container.md), [C3](../c4/03-component.md), [class diagrams](../uml/class-diagrams.md) |
| 6 | [Runtime view](06-runtime-view.md) | [Sequence diagrams](../uml/sequence-diagrams.md) |
| 7 | [Deployment view](07-deployment-view.md) | This section |
| 8 | [Cross-cutting concepts](08-crosscutting-concepts.md) | This section and the [AI flow specification](ai-flows.md) |
| 9 | [Architecture decisions](09-architecture-decisions.md) | This section |
| 10 | [Quality requirements](10-quality-requirements.md) | [Non-functional requirements](../../requirements/non-functional-requirements.md) |
| 11 | [Risks and technical debt](11-risks-and-technical-debt.md) | This section |
| 12 | [Glossary](12-glossary.md) | This section |

The [AI flow specification](ai-flows.md) is a supporting document of section 8: it is the contract between the system and the AI service for each of the six flows.
