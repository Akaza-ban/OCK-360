# 3. Context and Scope — OKR360 V1

## 3.1 Business context

| Partner | Exchanges with OKR360 |
|---|---|
| Employee | OKRs, check-ins, nominations, review forms; receives notifications and 360 results |
| Manager | Team OKRs, comments on check-ins, reviewer approval, routed blockers, weekly digests, 1-on-1 drafts |
| HR | Cycles, review templates and campaigns, final results |
| Administrator | Organization, users, automation flow settings |
| AI service | Receives free text with names replaced by codes; returns JSON |
| SMTP server | Receives notification and reminder emails |

The diagram is [C1 System Context](../c4/01-system-context.md). What is in and out of scope is in the [scope](../../01-scope.md); integrations with Jira, GitLab, Slack and Teams are out of V1.

## 3.2 Technical context

| Interface | Channel | Content | Notes |
|---|---|---|---|
| Browser → OKR360 | HTTPS, REST JSON under `/api/v1` | Every user operation | [OpenAPI](../../api/openapi.yaml); Bearer JWT |
| OKR360 → AI service | HTTPS | Instructions, coded data, expected JSON schema | Only through the AI Gateway (ADR-005); [AI flow specification](ai-flows.md) |
| OKR360 → SMTP server | SMTP | Notification emails | Sent by the Worker only |

Previous: [2. Architecture constraints](02-architecture-constraints.md) · Next: [4. Solution strategy](04-solution-strategy.md)
