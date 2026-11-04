# OKR360 API

> Design status: TARGET V1
>
> Implementation status: NOT STARTED; no backend yet

[`openapi.yaml`](openapi.yaml) is the contract between frontend and backend, with 89 operations. When the contract and the code differ, fix the contract first, then the code.

The easiest way to view it is to paste the file into [Swagger Editor](https://editor.swagger.io), or run:

```bash
npx @redocly/cli@1.25.15 preview-docs docs/api/openapi.yaml
```

## Conventions

| Item | Convention |
|---|---|
| Base URL | `/api/v1` |
| Authentication | `Authorization: Bearer <token>`, expires after 30 minutes, no refresh token. Only `login` needs no token |
| Format | JSON; file export uses `.xlsx` or `.pdf` |
| Date and time | `YYYY-MM-DD` for dates, ISO 8601 for timestamps |
| Progress | A number from 0 to 1; the UI multiplies by 100 for display |
| Pagination | `page` and `pageSize` (max 100); results contain `items`, `page`, `pageSize`, `total` |
| ID | 64-bit integer |

Each operation also has its own fields:

| Field | Meaning |
|---|---|
| `x-use-case` | Use case in [03-use-cases.md](../03-use-cases.md) |
| `x-roles` | Roles allowed to call. Data scope by reporting relationship is in the description |
| `x-permission` | Permission name in the use case |
| `x-business-rules` | Rule codes in [business-rules.md](../requirements/business-rules.md) |

## Errors

Every error is returned as `application/problem+json`, with `type`, `title`, `status`, `errorCode` and `traceId`. The UI shows `traceId` as a lookup code.

| Code | When |
|---|---|
| `400` | Invalid data; `errors` lists errors per field |
| `401` | Missing token, wrong or expired token; wrong login credentials |
| `403` | No permission for this role or this data |
| `404` | Not found, or soft-deleted |
| `409` | Wrong business state, e.g. the cycle is closed |
| `429` | More than 5 failed logins in 15 minutes |

## AI in the API

- Check-in, creating an Objective and closing a 360 campaign do not wait for AI. AI labels appear later, so `insight` can be `null`.
- `checkReviewComment` is the only operation that waits for AI, at most 5 seconds. If AI fails it still returns `200` with `checked: false`, so the UI lets the user submit normally.
- No operation allows editing an AI label or the original AI suggestion.
- `AutomationRun` holds only technical metrics, not the content sent to AI.

## Operations added beyond the screen design

When writing the contract, the following 6 operations were added because the screens need them but the planned list did not have them:

| Operation | Reason |
|---|---|
| `listUserDirectory` | `listUsers` is for Admin and HR only, while every employee needs to find colleagues to nominate |
| `getCampaign` | The campaign detail screen needs the campaign's information |
| `listReviewResultSubjects` | Managers and HR need to know whose results they can view |
| `getMyFinalResult` | Employees need to see their own final result |
| `getAutomationRun` | UC28 opens the details of one run |
| `getAiRunExplanation` | The "What did AI do?" panel (`SCR-84`) |

## Decisions made while writing the contract

- A Manager's `FINAL_RESULTS` report includes only direct reports, because it contains the 360 score (BR-080, BR-063).
- After a campaign is closed, `getReviewForm` returns `404` because the answers have been separated from the reviewer. `listMyReviewForms` still shows the form status (BR-057).
- V1 stores the avatar as a path in `avatarUrl`; there is no file upload API yet.

**Related:** [C4 Architecture](../architecture/c4/README.md) · [Business Rules](../requirements/business-rules.md) · [Acceptance Criteria](../06-acceptance-criteria.md)
