# C1 — System Context — OKR360 V1

> Design status: TARGET V1
>
> Implementation status: NOT STARTED; no backend yet, the UI currently runs on mock data

OKR360 is a web system used internally by one company. The system calls out to only two external services: the AI service and the email server.

```mermaid
flowchart TB
    employee(["Employee<br/>OKR, check-in, 360 forms"])
    manager(["Manager<br/>Track the team, approve"])
    hr(["HR<br/>Cycles, 360 campaigns, results"])
    admin(["Administrator<br/>Organization, automation flows"])

    okr360["<b>OKR360</b><br/>OKR management, 360-degree review<br/>and AI automation"]

    ai["AI Service<br/>External language model"]
    smtp["SMTP Server<br/>Sends email"]

    employee & manager & hr & admin -->|"Use via browser, HTTPS"| okr360
    okr360 -->|"Send text with names replaced by codes,<br/>receive JSON"| ai
    okr360 -->|"Send notifications, reminders"| smtp

    classDef actor fill:#666,color:#fff,stroke:#333
    classDef system fill:#1168bd,color:#fff,stroke:#0b4f9e
    classDef external fill:#8a8a8a,color:#fff,stroke:#5e5e5e
    class employee,manager,hr,admin actor
    class okr360 system
    class ai,smtp external
```

Next: [C2 Container](02-container.md) · [C4 index](README.md)
