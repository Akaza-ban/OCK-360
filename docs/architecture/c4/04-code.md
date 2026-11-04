# C4 — Code — OKR360 V1

> Design status: TARGET V1
>
> Implementation status: NOT STARTED; no backend yet, the UI currently runs on mock data

Level 4 of the C4 model shows the classes inside each component. For OKR360 this level is drawn as UML class diagrams, so it lives in the UML folder instead of being repeated here.

| Component (C3) | Class diagram |
|---|---|
| Shared: guards, `AccessPolicy`, `Database`, audit, notifications | [Shared parts](../uml/class-diagrams.md#1-shared-part) |
| Auth and authorization, Organization | [Login and organization](../uml/class-diagrams.md#2-login-and-organization) |
| OKR | [OKR and check-in](../uml/class-diagrams.md#3-okr-and-check-in) |
| 360 Review | [360 review](../uml/class-diagrams.md#4-360-review) |
| Results and reports, System | [Results, dashboards, reports, system](../uml/class-diagrams.md#5-results-dashboard-reports-system) |
| Automation, AI Gateway, Worker | [Automation and AI Gateway](../uml/class-diagrams.md#6-automation-and-ai-gateway) |

How these classes collaborate in each use case is in the [sequence diagrams](../uml/sequence-diagrams.md).

Previous: [C3 Component](03-component.md) · [C4 index](README.md)
