# C3 — Component — OKR360 V1

> Design status: TARGET V1
>
> Implementation status: NOT STARTED; no backend yet, the UI currently runs on mock data

## API

Each NestJS module is split into three layers per the [scope](../../01-scope.md): API receives requests, Application holds business logic, Infrastructure works with the database and external services.

```mermaid
flowchart TB
    spa["Web App"]

    subgraph api["API (NestJS)"]
        guard["<b>Auth and authorization</b><br/>JWT, roles,<br/>reporting relationship"]
        org["<b>Organization</b><br/>Departments, teams,<br/>users, profiles"]
        okr["<b>OKR</b><br/>Cycles, Objectives, KRs,<br/>check-ins, roll-up"]
        review["<b>360 Review</b><br/>Form templates, campaigns, nominations,<br/>forms, anonymous results"]
        result["<b>Results and reports</b><br/>Final scores, dashboards,<br/>XLSX, PDF export"]
        system["<b>System</b><br/>Notifications, logs"]
        automation["<b>Automation</b><br/>Flow configuration, run history,<br/>blockers, digests, drafts"]
        gateway["<b>AI Gateway</b><br/>Replace names with codes,<br/>call AI service"]
    end

    db[("Database")]
    ai["AI Service"]

    spa --> guard
    guard --> org & okr & review & result & system & automation
    review -->|"360 comment check"| gateway
    org & okr & review & result & system & automation --> db
    gateway --> ai

    classDef ext fill:#8a8a8a,color:#fff,stroke:#5e5e5e
    classDef comp fill:#1168bd,color:#fff,stroke:#0b4f9e
    classDef aiComp fill:#8a6d3b,color:#fff,stroke:#6b532c
    class spa,db,ai ext
    class guard,org,okr,review,result,system comp
    class automation,gateway aiComp
```

| Module | Use case | Key point to keep |
|---|---|---|
| Auth and authorization | UC01, UC02 | Every API except login goes through here (BR-002) |
| Organization | UC03, UC04, UC05 | The reporting relationship is not derived from the unit tree (BR-016) |
| OKR | UC06–UC14 | Check-in and roll-up in the same transaction (BR-043) |
| 360 Review | UC15–UC21 | The only place that reads scores by group and applies the anonymity threshold (BR-059) |
| Results and reports | UC22, UC23, UC24 | Gets the 360 score through the 360 Review module, does not read the form table directly |
| System | UC25, UC26 | Append-only log (BR-083) |
| Automation | UC27–UC31 | Only reads, and updates the human part of AI results |
| AI Gateway | UC19 | Shared with the Worker; waits at most 5 seconds, on failure lets the user submit (BR-101) |

## Worker

The Worker has no controllers. The five background flows share one pipeline; each flow differs only in data retrieval, JSON schema and action.

```mermaid
flowchart LR
    db1[("domain_events")]
    subgraph worker["Worker (NestJS)"]
        scheduler["<b>Scheduler</b><br/>Schedules in automation_flows,<br/>reminders"]
        poller["<b>Outbox reader</b><br/>SKIP LOCKED"]
        runner["<b>Flow runner</b><br/>On/off, quota,<br/>deduplication, retry"]
        flows["<b>5 flows</b><br/>Own data, JSON schema,<br/>action"]
        gateway["<b>AI Gateway</b><br/>Replace names with codes,<br/>call AI service"]
        validator["<b>Schema validation</b><br/>If invalid, no action"]
        mail["<b>Email sending</b>"]
    end
    db2[("AI result tables,<br/>notifications,<br/>automation_runs")]
    ai["AI Service"]
    smtp["SMTP Server"]

    db1 -->|"Unprocessed events"| poller
    poller --> runner
    scheduler -->|"Schedule due"| runner
    runner --> flows
    flows --> gateway
    gateway -->|"Text with codes"| ai
    ai -->|"JSON"| gateway
    gateway --> validator
    validator -->|"Valid"| db2
    scheduler -->|"Reminders, no AI"| db2
    db2 -->|"Notifications not yet emailed"| mail
    mail --> smtp

    classDef ext fill:#8a8a8a,color:#fff,stroke:#5e5e5e
    classDef comp fill:#1168bd,color:#fff,stroke:#0b4f9e
    classDef aiComp fill:#8a6d3b,color:#fff,stroke:#6b532c
    class db1,db2,ai,smtp ext
    class scheduler,poller,runner,flows,validator,mail comp
    class gateway aiComp
```

The AI call step is outside the transaction; the result, notifications and run history are written in a new transaction ([data design](../../05-data-model.md), section 4). The code-mapping table (name to code) exists only in the memory of a run (BR-093).

Previous: [C2 Container](02-container.md) · Next: [C4 Code](04-code.md) · [C4 index](README.md)
