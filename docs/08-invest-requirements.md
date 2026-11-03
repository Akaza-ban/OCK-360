# INVEST Requirements — OKR360 V1

> Design status: TARGET V1 — Step 1

Each user story is the lowest level of the top-down breakdown, small enough to build and test independently. The cross-cutting constraints (authentication, authorization, data validation, audit log, error handling, anonymity) are **acceptance constraints**, not hidden features.

## INVEST criteria

| Criterion | How it applies in OKR360 |
|---|---|
| **Independent** | Each story produces a demonstrable outcome; it depends on another story only when unavoidable. |
| **Negotiable** | UI layout and implementation approach can change, as long as the outcome and the permission rules stay the same. |
| **Valuable** | Each story states its value to the user or the company. |
| **Estimable** | Inputs, outputs, roles and important error cases are written down. |
| **Small** | Each story targets one main capability and can be split into API, business logic, storage, UI and test work. |
| **Testable** | Each story is tied to observable acceptance criteria in [06-acceptance-criteria.md](06-acceptance-criteria.md). |

## Story groups

```text
US01–US03   Access and profile                (F01, F12)
US04–US06   Organization and cycles           (F02, F03)
US07–US11   OKR management                    (F04)
US12–US14   Check-in and progress             (F05)
US15–US21   360-degree review                 (F06)
US22        Final results                     (F07)
US23–US26   Dashboard, reports, notifications, audit log   (F08–F11)
US27–US34   AI automation                     (F13)
```

## Product backlog

| ID | User story | Value | Dependencies | Acceptance criteria | Priority |
|---|---|---|---|---|---|
| US01 | As an active user, I want to log in so that I can securely access the work I am allowed to do. | Access protection | Pre-seeded account | AC-UC01 | Must |
| US02 | As a logged-in user, I want to log out so that this device clears my session. | Session safety | US01 | AC-UC02 | Must |
| US03 | As a user, I want to update my profile and change my password without being able to change my own role, so that my account stays accurate and secure. | Self-service | US01 | AC-UC03 | Should |
| US04 | As an Admin or HR, I want to manage departments, teams within departments, department heads and team leads so that the OKR tree reflects the company's structure. | Foundation for the goal tree | US01 | AC-UC04 | Must |
| US05 | As an Admin or HR, I want to manage users, roles and direct managers so that the system knows who reports to whom. | Foundation for authorization and 360 | US04 | AC-UC05 | Must |
| US06 | As an Admin or HR, I want to create, activate and close OKR cycles so that the whole company works on the same timeline. | Shared operating rhythm | US01 | AC-UC06 | Must |
| US07 | As an employee, I want to view the company-wide OKR tree so that I know what my goals contribute to. | Transparency, alignment | US06 | AC-UC07 | Must |
| US08 | As an employee/manager/admin, I want to create and edit Objectives at the levels I am allowed so that I can record what I want to achieve in the cycle. | Clear goals | US06 | AC-UC08 | Must |
| US09 | As an Objective owner, I want to add 1–5 measurable Key Results so that I know when the goal is achieved. | Measurable goals | US08 | AC-UC09 | Must |
| US10 | As an Objective owner, I want to link my Objective to a higher-level goal so that my progress contributes to the shared goal. | Tree alignment | US08 | AC-UC10 | Must |
| US11 | As an OKR owner, Manager or Admin, I want to soft-delete a mistakenly created OKR so that it disappears from the tree and reports but remains traceable. | Clean, traceable data | US08 | AC-UC11 | Should |
| US12 | As a Key Result owner, I want to check in the current value and my confidence level so that everyone sees real progress immediately. | Real-time progress | US09 | AC-UC12 | Must |
| US13 | As an employee, I want to view a KR's check-in history and progress chart so that I know since when it has stalled. | Early problem detection | US12 | AC-UC13 | Must |
| US14 | As a Manager, I want to comment on my direct reports' check-ins so that I can support them promptly when they hit blockers. | Continuous coaching | US12 | AC-UC14 | Could |
| US15 | As HR, I want to create a set of evaluation criteria so that 360 campaigns share one standard. | Consistent evaluation | US01 | AC-UC15 | Must |
| US16 | As HR, I want to create a review campaign tied to a cycle, choosing participants and deadlines, so that 360 reviews are organized at the right time. | Running review campaigns | US05, US06, US15 | AC-UC16 | Must |
| US17 | As a reviewee, I want to nominate 3–5 colleagues who understand my work so that I receive realistic feedback. | Feedback from the right people | US16 | AC-UC17 | Must |
| US18 | As a Manager, I want to approve, add or remove reviewers for my direct reports so that the selection is not made up only of close friends. | Objective evaluation | US17 | AC-UC18 | Must |
| US19 | As a reviewer, I want to rate and comment on a form, save a draft and submit, so that I can give candid feedback without revealing my identity. | Honest feedback | US18 | AC-UC19 | Must |
| US20 | As HR, I want to track the form submission rate, remind those who have not submitted, and close the campaign, so that the review campaign finishes on time. | Progress control | US19 | AC-UC20 | Must |
| US21 | As an employee, I want to view my 360 results (by criterion, by reviewer group, and the gap versus self-assessment) so that I know what to improve. | Personal development | US20 | AC-UC21 | Must |
| US22 | As HR, I want to consolidate OKR and 360 scores by weight and then publish them, so that there is end-of-period data for rewards and development decisions. | HR decision-making | US12, US20 | AC-UC22 | Must |
| US23 | As a user, I want a role-based dashboard so that I immediately see what I need to do and the state of the goals. | Quick overview | US12 | AC-UC23 | Should |
| US24 | As an Admin, HR or Manager, I want to view and export reports with filters so that I can analyze and share them. | Analysis, sharing | US12, US22 | AC-UC24 | Should |
| US25 | As a user, I want to receive timely notifications and reminders so that I do not forget to check in or submit forms. | Higher participation | US12, US16 | AC-UC25 | Should |
| US26 | As an Admin or HR, I want to view the audit log so that I can trace important changes. | Accountability | US01 | AC-UC26 | Should |
| US27 | As an Admin, I want to enable/disable each automated flow, set its run schedule and AI call quota, so that I control cost and can immediately turn off a misbehaving flow. | Operational control | US01 | AC-UC27 | Must |
| US28 | As an Admin or HR, I want to view the run history of the flows (status, errors, attempt count) and re-run failed runs, so that I know which flow is broken. | Monitoring, troubleshooting | US32 | AC-UC28 | Should |
| US29 | As a department head, I want to immediately receive the blockers that other departments are waiting on my department to resolve, so that I can clear them before their KRs fall behind. | Early cross-department blocker removal | US12, US32 | AC-UC29 | Must |
| US30 | As a Manager, I want to receive a weekly digest summarizing my team's check-ins and blockers on Monday morning, so that I do not have to read each check-in before the meeting. | Saves management time | US12, US32 | AC-UC30 | Must |
| US31 | As a Manager, I want a ready-made draft summarizing each employee's 360 comments that I can edit and send, so that I can prepare for the 1-1 faster. | Timely development feedback | US20, US32 | AC-UC31 | Must |
| US32 | As an Admin, I want all AI flows to run in the background, replace people's names with codes, validate results and never modify scores, so that automation is safe and keeps anonymity. | Safe automation | US27 | AC-UC32 | Must |
| US33 | As an employee, I want to be reminded when a check-in contradicts its note and when a newly created OKR has hard-to-measure KRs, so that my OKRs reflect reality. | Better-quality OKRs | US08, US12, US32 | AC-UC32 | Should |
| US34 | As a reviewer, I want to be warned when a comment could reveal my identity so that I can give candid feedback and still stay safe. | Protects feedback givers | US19 | AC-UC19 | Should |

## INVEST assessment per story

`PASS` means the current design has enough information for planning and acceptance, not that it has been implemented. `REVIEW` means the story does not meet the Small criterion and needs to be split when planning the implementation.

| Story | I | N | V | E | S | T | Notes |
|---|---|---|---|---|---|---|---|
| US01 | PASS | PASS | PASS | PASS | PASS | PASS | 30-minute JWT, no refresh token. |
| US02 | PASS | PASS | PASS | PASS | PASS | PASS | Client-side logout. |
| US03 | PASS | PASS | PASS | PASS | PASS | PASS | Editable fields are specified. |
| US04 | PASS | PASS | PASS | PASS | PASS | PASS | Department and team tree prevents cycles; a team sits only under a department. |
| US05 | PASS | PASS | PASS | PASS | PASS | PASS | Reporting relationships prevent cycles. |
| US06 | PASS | PASS | PASS | PASS | PASS | PASS | Cycle state machine. |
| US07 | PASS | PASS | PASS | PASS | PASS | PASS | Read-only; tree performance in NFR-PERF-003. |
| US08 | PASS | PASS | PASS | PASS | PASS | PASS | Permissions by the 4 OKR levels; team OKRs are created by the team lead or department head. |
| US09 | PASS | PASS | PASS | PASS | PASS | PASS | Progress formula for each KR type. |
| US10 | PASS | PASS | PASS | PASS | PASS | PASS | 4-level linking rule, skip-level links allowed. |
| US11 | PASS | PASS | PASS | PASS | PASS | PASS | Cannot delete while child OKRs are still linked. |
| US12 | PASS | PASS | PASS | PASS | PASS | PASS | Technically the most important story: progress roll-up. |
| US13 | PASS | PASS | PASS | PASS | PASS | PASS | Expected line is linear over time. |
| US14 | PASS | PASS | PASS | PASS | PASS | PASS | Comment only, no editing of check-ins. |
| US15 | PASS | PASS | PASS | PASS | PASS | PASS | A template already used by a running campaign is locked against edits. |
| US16 | PASS | PASS | PASS | PASS | PASS | PASS | Review campaign state machine. |
| US17 | PASS | PASS | PASS | PASS | PASS | PASS | 3–5 colleagues. |
| US18 | PASS | PASS | PASS | PASS | PASS | PASS | HR approves instead when there is no manager. |
| US19 | PASS | PASS | PASS | PASS | PASS | PASS | Anonymity and "Not enough information". |
| US20 | PASS | PASS | PASS | PASS | PASS | PASS | HR sees only the count of missing forms per reviewer, not who-rates-whom pairs. |
| US21 | PASS | PASS | PASS | PASS | PASS | PASS | Minimum threshold of 3 forms per group. |
| US22 | PASS | PASS | PASS | PASS | **REVIEW** | PASS | Largest story; can be split into "scoring" and "publishing". Default 60/40 weight is settled (BR-072). Already split in the [implementation plan](09-implementation-plan.md#3-splitting-stories-that-are-too-large). |
| US23 | PASS | PASS | PASS | PASS | **REVIEW** | PASS | Three kinds of dashboards; should be split into 3 stories during sprint planning. Already split in the [implementation plan](09-implementation-plan.md#3-splitting-stories-that-are-too-large). |
| US24 | PASS | PASS | PASS | PASS | PASS | PASS | 360 reports respect the anonymity threshold. |
| US25 | PASS | PASS | PASS | PASS | PASS | PASS | Reminder schedule is described in UC25. |
| US26 | PASS | PASS | PASS | PASS | PASS | PASS | The log does not contain anonymous reviewer–reviewee pairs. |
| US27 | PASS | PASS | PASS | PASS | PASS | PASS | Prebuilt flows only, no free-form flow builder. |
| US28 | PASS | PASS | PASS | PASS | PASS | PASS | History does not store the content sent to the AI. |
| US29 | PASS | PASS | PASS | PASS | PASS | PASS | Has a "Not relevant to my department" button to measure accuracy. |
| US30 | PASS | PASS | PASS | PASS | PASS | PASS | Numbers come from the database; the AI only writes the summary. |
| US31 | PASS | PASS | PASS | PASS | PASS | PASS | Can be sent only after the campaign is `PUBLISHED`; uses only groups that meet the anonymity threshold. |
| US32 | PASS | PASS | PASS | PASS | **REVIEW** | PASS | Foundation of F13; should be split into "event recording and queue", "AI call and result validation", "retry and duplicate-run prevention". The AI service is chosen when building the backend, via the AI Gateway (ADR-005). Already split in the [implementation plan](09-implementation-plan.md#3-splitting-stories-that-are-too-large). |
| US33 | PASS | PASS | PASS | PASS | PASS | PASS | Merges two small flows of the same "remind the writer" kind. |
| US34 | PASS | PASS | PASS | PASS | PASS | PASS | Runs synchronously, at most 5 seconds; if the AI fails, submission is still allowed. |

## Cross-cutting acceptance constraints

- There are only 4 roles: `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`; every role inherits employee permissions.
- The backend (not the React UI) checks permissions, reporting relationships and ownership.
- Data of a `CLOSED` cycle is read-only.
- Queries exclude records with `deleted_at` by default.
- The identity of an anonymous reviewer does not appear in any user-facing API, report, export file or log.
- API errors use the `ProblemDetails` format (`400`, `401`, `403`, `404`, `409`, `429`).
- The AI does not score, grade, or modify OKR or 360 figures; people's names are replaced with codes before being sent to the AI service; content sent to other people always goes through a human review step.

**Related:** [Use cases](03-use-cases.md) · [Acceptance criteria](06-acceptance-criteria.md)
