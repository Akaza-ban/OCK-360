# Business Rules — OKR360 V1

> Design status: TARGET V1
>
> Implementation status: NOT STARTED

This document consolidates rules previously scattered across use cases, acceptance criteria, and database designs into a single reference, assigning each rule an identifier for OpenAPI, code, and test traceability. This document defines no new rules; it merely records finalized decisions. The **Source** column indicates the origin of each rule: numbers like `03` or `05 §2.2` refer to the corresponding documents in `docs/`, `UC` denotes use cases, `AC` denotes acceptance criteria, and `F` denotes features. In case of discrepancies, the source is re-examined and updated concurrently.

## Roles and Permissions

| ID | Rule | Source | Story |
|---|---|---|---|
| BR-001 | V1 includes only 4 roles: `ADMIN`, `HR`, `MANAGER`, and `EMPLOYEE`. Each user has exactly one role, and all roles inherit all permissions of `EMPLOYEE`. | 03, 08 | All |
| BR-002 | The backend enforces all final authorization checks, based on role, reporting hierarchy, and ownership. Hiding UI buttons is not a security measure. | 03, 08 | All |
| BR-003 | A Manager can only operate on their assigned unit and direct subordinates. Department heads manage their department and all teams within it; team leads only manage their own team. | 03 | US08, US18, US24 |
| BR-004 | HR cannot assign the Admin role. | UC05, AC-UC05 | US05 |
| BR-005 | Admin cannot view other users' 360 results, 360 summary reports, or 1-on-1 drafts. | 03, AC-UC21, AC-UC31 | US21, US24, US31 |

## Organization and Users

| ID | Rule | Source | Story |
|---|---|---|---|
| BR-010 | The organizational hierarchy must be acyclic. A team must be situated directly under a department and cannot have child units. | UC04, AC-UC04, 05 §2.0 | US04 |
| BR-011 | Departments or teams with active employees cannot be deactivated. | UC04, AC-UC04 | US04 |
| BR-012 | Email is unique among non-deleted accounts, allowing returning employees to reuse their previous email. | AC-UC05, 05 §2.4 | US05 |
| BR-013 | Users cannot manage themselves, and management loops are prohibited. | UC05, AC-UC05 | US05 |
| BR-014 | Deactivated users cannot log in and cannot be assigned as new reviewers. | UC05, AC-UC05 | US05 |
| BR-015 | Users cannot modify their own email, role, department, or direct manager. | UC03, AC-UC03 | US03 |
| BR-016 | Reporting lines follow direct managers, not inferred from the organizational unit tree. | 05 §2.0 | US05 |

## OKR Cycles

| ID | Rule | Source | Story |
|---|---|---|---|
| BR-020 | Cycles transition unidirectionally: `DRAFT` → `ACTIVE` → `CLOSED`; reversals are prohibited. | AC-UC06, 05 §2.5 | US06 |
| BR-021 | Only one cycle can be `ACTIVE` at any given time. | UC06, AC-UC06 | US06 |
| BR-022 | Creating and editing OKRs is permitted when the cycle is in `DRAFT` or `ACTIVE`. Check-in is permitted only when `ACTIVE`. A `CLOSED` cycle is read-only. | 03, AC-UC06, AC-UC12 | US06, US08, US12 |
| BR-023 | Upon cycle closure, final progress is snapshot once and remains immutable, even if calculation formulas change later. | UC06, 05 §2.2 | US06 |

## OKRs and Key Results

| ID | Rule | Source | Story |
|---|---|---|---|
| BR-030 | OKRs have 4 levels: company, department, team, individual. Creation and editing permissions follow the role matrix in 03. | 03, AC-UC08 | US08 |
| BR-031 | Department OKRs attach to department-type units; team OKRs attach to team-type units. | AC-UC08, 05 §2.1 | US08 |
| BR-032 | Each user has a maximum number of Objectives configured by the cycle. | UC08, AC-UC08 | US08 |
| BR-033 | Each Objective contains between 1 and 5 Key Results. | UC09, AC-UC09 | US09 |
| BR-034 | Numeric or percentage Key Results must define distinct initial and target values, along with a unit. Milestone (boolean) types do not require them. | AC-UC09 | US09 |
| BR-035 | Valid parent levels: department aligns to company; team aligns to department or company; individual aligns to team, department, or company. | AC-UC10, 05 §2.1 | US10 |
| BR-036 | A parent Objective must belong to the same cycle, must not be deleted, and must not form a circular reference. | AC-UC10 | US10 |
| BR-037 | OKRs are soft-deleted, not physically deleted. An Objective with linked child Objectives cannot be deleted. | UC11, AC-UC11 | US11 |

## Check-ins and Progress

| ID | Rule | Source | Story |
|---|---|---|---|
| BR-040 | Only the assignee of a Key Result can check in. | UC12, AC-UC12, 05 §2.3 | US12 |
| BR-041 | Check-ins are append-only; editing and deletion are prohibited. Erroneous entries are superseded by creating a new check-in. | AC-UC12, 05 §2.3 | US12 |
| BR-042 | KR progress = (current − initial) / (target − initial), clamped to 0–100%. The formula works correctly for decreasing targets as well. | F05, 05 §2.2 | US12 |
| BR-043 | Progress is recalculated along the ancestor Objective chain within the same save transaction. | 03, AC-UC12 | US12 |
| BR-044 | Objective progress is the unweighted arithmetic mean of its Key Results and child Objectives, divided equally. V1 does not support custom weightings. | 05 §2.2, `okr.js` | US12 |
| BR-045 | The confidence level of an Objective is the worst level among its Key Results with check-ins. | `okr.js` | US07 |
| BR-046 | Selecting "Off track" triggers a notification to the direct manager. | UC12, AC-UC12 | US12 |
| BR-047 | Only direct managers can comment on check-ins, and comments cannot modify check-in records. | UC14, AC-UC14 | US14 |

## 360-Degree Feedback

| ID | Rule | Source | Story |
|---|---|---|---|
| BR-050 | Campaigns transition unidirectionally, one step at a time: `DRAFT` → `NOMINATION` → `COLLECTING` → `CLOSED` → `PUBLISHED`. | AC-UC16, 05 §2.5 | US16 |
| BR-051 | Each cycle has at most one 360 campaign. A campaign binds to exactly one cycle and one review template. | README §4.1, AC-UC16 | US16 |
| BR-052 | A review template must have at least 1 scoring criterion. A template used by a non-`DRAFT` campaign cannot be modified, only cloned. | AC-UC15 | US15 |
| BR-053 | Each user nominates 3–5 peers, excluding themselves, their direct manager, direct subordinates, or deactivated users. | UC17, AC-UC17 | US17 |
| BR-054 | Following approval, the nominee list maintains 3–5 peers. If an employee fails to nominate by the deadline, their manager assigns the required count. | UC18, AC-UC18 | US18 |
| BR-055 | Upon opening collection, the system snapshots reporting relationships, generates review forms, and locks the cycle's OKR/360 weight ratio. All campaign calculations rely on this snapshot. | UC16, 05 §2.5, 05 §2.6 | US16 |
| BR-056 | Submitting a review requires a rating of 1–5 or "Not enough information" for every criterion. Saving drafts does not require this. | AC-UC19 | US19 |
| BR-057 | Submitted reviews can be modified while the campaign remains in `COLLECTING`. After closure, reviewers cannot modify or review submission contents. | AC-UC19 | US19 |
| BR-058 | Upon campaign closure, unsubmitted reviews are discarded, and answers are permanently decoupled from reviewers. | UC20, 05 §3.1 | US20 |
| BR-059 | If Peer or Subordinate groups have fewer than 3 reviews, the two groups are merged. If the merged group still has fewer than 3 reviews, it is hidden and excluded from scoring. | UC21, 05 §3.2 | US21 |
| BR-060 | No screen, report, export file, API, or audit log reveals who reviewed whom within anonymous groups. | 03, 08, AC-UC26 | US19, US21 |
| BR-061 | HR can only view the count of missing reviews per reviewer, not whom the missing reviews target if they belong to anonymous groups. | UC20, AC-UC20 | US20 |
| BR-062 | The 360 score is the average across visible groups, excluding self-evaluations. | 05 §3.2 | US21 |
| BR-063 | Employees view their results once the campaign is `PUBLISHED`. Managers view direct subordinates' results once `CLOSED`. HR views results for all users. | UC21, AC-UC21 | US21 |

## Final Evaluation

| ID | Rule | Source | Story |
|---|---|---|---|
| BR-070 | Synthesis occurs only when both the cycle and the review campaign are `CLOSED`. Prior to publication, HR may re-synthesize; once published, results are immutable. | UC22, AC-UC22 | US22 |
| BR-071 | OKR score = 1 + 4 × OKR progress, on a 1–5 scale. | AC-UC22, 05 §5 | US22 |
| BR-072 | Final score = OKR weight × OKR score + (1 − OKR weight) × 360 score. Defaults to 0.6 and 0.4. | AC-UC22, 05 §5 | US22 |
| BR-073 | Performance ratings: 4.5 and above: Outstanding; 3.5 and above: Good; 2.5 and above: Meets Expectations; below 2.5: Needs Improvement. | 05 §5 | US22 |
| BR-074 | Missing OKR score or 360 score is recorded as "Missing data", without assigning 0 points or a performance rating. | UC22, AC-UC22, 05 §5 | US22 |
| BR-075 | Each employee can only view their own results. | UC22, AC-UC22 | US22 |

## Reports, Notifications, and Audit Logs

| ID | Rule | Source | Story |
|---|---|---|---|
| BR-080 | Reports only contain data within the viewer's authorization scope, and 360 reports enforce anonymity thresholds. A Manager's final evaluation report includes direct subordinates only. | UC24, AC-UC24, BR-063 | US24 |
| BR-081 | Each user receives at most one reminder per event type per day. | UC25, AC-UC25, 05 §6 | US25 |
| BR-082 | Reminder events include: KR without check-in for 7 days, uncompleted nomination, pending reviews. | UC25, AC-UC25 | US25 |
| BR-083 | Audit logs are append-only and contain no passwords, tokens, scores, comments, or reviewer-reviewee pairs for anonymous groups. | UC26, AC-UC26, 05 §6 | US26 |

## AI Automation

| ID | Rule | Source | Story |
|---|---|---|---|
| BR-090 | AI does not score, grade, or alter OKR or 360 figures. AI outputs are limited to tags, warnings, notifications, notes, or drafts. | 03, AC-UC32 | US32 |
| BR-091 | All AI-generated content is tagged "AI-generated". | 03, 04 | US29–US34 |
| BR-092 | Content destined for individuals other than the author is always a draft, requiring human review prior to sending. Employees never see raw AI output. | 03, UC31, 05 §7.3 | US31 |
| BR-093 | Prior to sending to AI services, personal names are pseudonymized with codes; units are transmitted as codes with an accompanying directory. Email addresses and phone numbers are never transmitted. The pseudonymization map resides in memory for the run only. | 03, AC-UC32, 05 §7.4 | US32 |
| BR-094 | 360 comments are sent to AI in only two flows: 1-on-1 Draft (campaign `CLOSED`, group meets threshold, individual ratings excluded) and Comment Guard (review submission, pseudonymized). | 03 | US31, US34 |
| BR-095 | User-entered text is treated strictly as data, not instructions for AI. JSON schema non-compliance results in taking no action and logging an Error. | 03, AC-UC32 | US32 |
| BR-096 | AI flows execute in the background after original mutations have committed. Slow or failing AI does not compromise the underlying mutation. | 03, AC-UC32, 05 §7.1 | US32 |
| BR-097 | Failures retry after 1, 5, and 15 minutes, then mark as Failed. Each entity is processed at most once per flow. | UC32, AC-UC32, 05 §7.2 | US32 |
| BR-098 | Each flow has a daily AI invocation quota. Exceeding quota suspends the flow until the next day, marks events as Skipped, and alerts Admins. | 03, AC-UC32 | US27, US32 |
| BR-099 | Disabling a flow marks new events as Skipped without calling AI. All other features continue normal operations. | UC27, AC-UC27 | US27 |
| BR-100 | Automation run history stores only technical telemetry, containing neither input sent to AI nor raw AI responses. | UC28, AC-UC28, 05 §7.4 | US28 |
| BR-101 | The 360 review comment guard waits up to 5 seconds; on AI failure or timeout, review submission proceeds. Warnings are visible to the author only, never persisted, and generate no run history record. | UC19, AC-UC19, 05 §7.4 | US34 |
| BR-102 | Blockers cannot be routed back to the reporter's own unit or the department containing their team. | AC-UC29, 05 §7.3 | US29 |
| BR-103 | If the assignee rejects a blocker, it routes back to the check-in author's direct manager and counts as an AI misclassification. | UC29, AC-UC29 | US29 |
| BR-104 | Inconsistencies between confidence level and check-in notes trigger a prompt to the check-in author; 3 consecutive occurrences alert their direct manager. | F13.4, AC-UC32 | US33 |
| BR-105 | Metrics in the weekly digest originate from the database; AI only drafts the summary, up to 3 items. Each manager receives one digest per week. | UC30, AC-UC30 | US30 |
| BR-106 | 1-on-1 drafts can only be sent when the campaign is `PUBLISHED`, and contain no verbatim quotes or individual ratings. If no groups meet the threshold, or eligible groups lack open-ended comments, no draft is generated. | UC31, AC-UC31 | US31 |

**Related:** [Non-Functional Requirements](non-functional-requirements.md) · [Use Cases](../03-use-cases.md) · [Acceptance Criteria](../06-acceptance-criteria.md) · [Data Model](../05-data-model.md)