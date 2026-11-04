# C4 Model — OKR360 V1

The system is described at the four levels of the [C4 model](https://c4model.com), from the outside in. Each level zooms into one box of the level above.

| Level | Document | Shows |
|---|---|---|
| C1 | [System Context](01-system-context.md) | OKR360, its users and the two external services: the AI service and the SMTP server |
| C2 | [Container](02-container.md) | Web App, API, Worker and Database, and what each one does and does not do |
| C3 | [Component](03-component.md) | The NestJS modules of the API and the pipeline inside the Worker |
| C4 | [Code](04-code.md) | Links to the UML class diagrams of each component |

Conventions used in every diagram:

- Blue boxes are parts of OKR360; brown boxes are the parts that run AI flows; grey boxes are outside the system.
- Every arrow is labelled with what flows along it.

Why the architecture looks this way is recorded in the [arc42 documentation](../arc42/README.md), mainly the [solution strategy](../arc42/04-solution-strategy.md) and the [architecture decisions](../arc42/09-architecture-decisions.md). Deployment is in the [deployment view](../arc42/07-deployment-view.md).
