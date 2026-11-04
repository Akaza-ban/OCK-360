# C2 — Container — OKR360 V1

> Design status: TARGET V1
>
> Implementation status: NOT STARTED; no backend yet, the UI currently runs on mock data

The system consists of 4 independently running parts. The backend is split into two processes sharing one NestJS codebase: the API serves users, the Worker does background work. This way a slow AI does not slow down the API.

```mermaid
flowchart TB
    user(["User"])

    subgraph system["OKR360"]
        spa["<b>Web App</b><br/>React, Vite<br/>Role-based UI"]
        api["<b>API</b><br/>NestJS<br/>REST JSON, JWT, authorization,<br/>business logic"]
        worker["<b>Worker</b><br/>NestJS<br/>Scheduler, AI processor,<br/>email sending"]
        db[("<b>Database</b><br/>PostgreSQL 15+<br/>okr360 schema, triggers,<br/>event outbox")]
    end

    ai["AI Service"]
    smtp["SMTP Server"]

    user -->|"HTTPS"| spa
    spa -->|"REST JSON, Bearer token"| api
    api -->|"Read, write; events written<br/>in the same transaction"| db
    worker -->|"Receive events, write labels,<br/>notifications, drafts"| db
    worker -->|"Background flows"| ai
    api -->|"Only the 360 comment check,<br/>max 5 seconds"| ai
    worker -->|"Send email"| smtp

    classDef actor fill:#666,color:#fff,stroke:#333
    classDef container fill:#1168bd,color:#fff,stroke:#0b4f9e
    classDef background fill:#8a6d3b,color:#fff,stroke:#6b532c
    classDef external fill:#8a8a8a,color:#fff,stroke:#5e5e5e
    class user actor
    class spa,api,db container
    class worker background
    class ai,smtp external
    style system fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```

| Container | Responsibility | Does not do |
|---|---|---|
| Web App | Displays by role, calls the API | Does not call AI; hides buttons only to keep the UI tidy, not for security |
| API | Authentication, authorization, business logic, transactions, reports, file export | Does not call AI for background flows, does not send email directly |
| Worker | Runs on schedule, processes the event outbox, calls AI, validates results, sends email | Does not accept user requests; does not write to OKR or 360 tables |
| Database | Stores data, blocks invalid data with constraints and triggers, records events | Does not apply the anonymity threshold; that is in the business layer |

Previous: [C1 System Context](01-system-context.md) · Next: [C3 Component](03-component.md) · [C4 index](README.md)
