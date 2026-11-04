# UML Diagrams — OKR360 V1

Detailed design of the backend, drawn in Mermaid so it renders on GitHub.

| Document | Contents |
|---|---|
| [Class diagrams](class-diagrams.md) | Controllers, services, repositories, AI Gateway and Worker classes of every module; every controller method is one OpenAPI `operationId`. This is C4 level 4 |
| [Sequence diagrams](sequence-diagrams.md) | One sequence diagram per use case (SD-01 to SD-32), including the main error branches |
| [API to UML traceability](api-traceability.md) | Every OpenAPI operation with its controller method, use case, sequence diagram and roles |

Use case diagrams are in [Use Cases](../../03-use-cases.md). Every class and method used in a sequence diagram exists in the class diagrams; when one changes, update the other.

**Related:** [C4 model](../c4/README.md) · [arc42](../arc42/README.md) · [OpenAPI](../../api/openapi.yaml)
