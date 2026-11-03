# Traceability Matrix — OKR360 V1

> Design status: TARGET V1
>
> Testing status: Test case IDs defined in [test cases](test-cases.md); no tests implemented yet.

This table traces each user story across the entire design, ensuring no requirements are missed and clarifying the impact radius when modifying a requirement. When adding or changing a story, update its corresponding row.

| Column | Source |
|---|---|
| Story, Priority | [User stories](08-invest-requirements.md) |
| UC | [Use cases](03-use-cases.md) |
| AC | [Acceptance criteria](06-acceptance-criteria.md) |
| Screen | [Information architecture](04-information-architecture.md) |
| Rules | [Business rules](requirements/business-rules.md) |
| API | `operationId` in [OpenAPI](api/openapi.yaml), grouped by `x-use-case` |
| Module | Backend module in [class diagrams](architecture/class-diagrams.md) |
| Database | Table in [okr360.sql](../src/database/okr360.sql) read or written by the use case |
| Sequence | [Sequence diagrams](architecture/sequence-diagrams.md), matching the use case number |
| Test | Test case ID in [test cases](test-cases.md), derived from acceptance criteria |

## Traceability by User Story

| Story | Priority | UC | AC | Screen | Rules | API | Module | Database | Sequence | Test |
|---|---|---|---|---|---|---|---|---|---|---|
| US01 | Must | UC01 | AC-UC01 | SCR-01 | BR-001, BR-002 | `login` | `auth` | `app_users`, `audit_logs` | SD-01 | TC-UC01-01 … TC-UC01-04 |
| US02 | Must | UC02 | AC-UC02 | SCR-01 | BR-001, BR-002 | `logout` | `auth` | — | SD-02 | TC-UC02-01 … TC-UC02-02 |
| US03 | Should | UC03 | AC-UC03 | SCR-70 | BR-001, BR-002, BR-015 | `getProfile`, `updateProfile`, `changePassword` | `organization` | `app_users` | SD-03 | TC-UC03-01 … TC-UC03-02 |
| US04 | Must | UC04 | AC-UC04 | SCR-51 | BR-001, BR-002, BR-010, BR-011 | `listDepartments`, `createDepartment`, `updateDepartment`, `deactivateDepartment` | `organization` | `departments`, `audit_logs` | SD-04 | TC-UC04-01 … TC-UC04-04 |
| US05 | Must | UC05 | AC-UC05 | SCR-52 | BR-001, BR-002, BR-004, BR-012, BR-013, BR-014, BR-016 | `listUsers`, `createUser`, `getUser`, `updateUser`, `updateUserStatus` | `organization` | `app_users`, `audit_logs` | SD-05 | TC-UC05-01 … TC-UC05-04 |
| US06 | Must | UC06 | AC-UC06 | SCR-50 | BR-001, BR-002, BR-020, BR-021, BR-022, BR-023 | `listCycles`, `createCycle`, `updateCycle`, `activateCycle`, `closeCycle` | `okr` | `okr_cycles`, `objectives` | SD-06 | TC-UC06-01 … TC-UC06-04 |
| US07 | Must | UC07 | AC-UC07 | SCR-11, SCR-12 | BR-001, BR-002, BR-045 | `listObjectives`, `getObjectiveTree`, `getObjective` | `okr` | `objectives`, `key_results` | SD-07 | TC-UC07-01 … TC-UC07-04 |
| US08 | Must | UC08 | AC-UC08 | SCR-10, SCR-11, SCR-13 | BR-001, BR-002, BR-003, BR-022, BR-030, BR-031, BR-032 | `createObjective`, `updateObjective`, `listObjectiveReviewNotes`, `dismissObjectiveReviewNote` | `okr` | `objectives`, `key_results`, `domain_events`, `audit_logs` | SD-08 | TC-UC08-01 … TC-UC08-04 |
| US09 | Must | UC09 | AC-UC09 | SCR-13 | BR-001, BR-002, BR-033, BR-034 | `createKeyResult`, `updateKeyResult`, `deleteKeyResult` | `okr` | `key_results`, `objectives` | SD-09 | TC-UC09-01 … TC-UC09-03 |
| US10 | Must | UC10 | AC-UC10 | SCR-13 | BR-001, BR-002, BR-035, BR-036 | `linkParentObjective` | `okr` | `objectives` | SD-10 | TC-UC10-01 … TC-UC10-04 |
| US11 | Should | UC11 | AC-UC11 | SCR-12 | BR-001, BR-002, BR-037 | `deleteObjective` | `okr` | `objectives`, `audit_logs` | SD-11 | TC-UC11-01 … TC-UC11-03 |
| US12 | Must | UC12 | AC-UC12 | SCR-02, SCR-10, SCR-14 | BR-001, BR-002, BR-022, BR-040, BR-041, BR-042, BR-043, BR-044, BR-046 | `createCheckin` | `okr` | `checkins`, `key_results`, `objectives`, `domain_events`, `notifications`, `audit_logs` | SD-12 | TC-UC12-01 … TC-UC12-05 |
| US13 | Must | UC13 | AC-UC13 | SCR-12 | BR-001, BR-002 | `listCheckins` | `okr` | `checkins`, `checkin_comments`, `checkin_insights` | SD-13 | TC-UC13-01 … TC-UC13-02 |
| US14 | Could | UC14 | AC-UC14 | SCR-12 | BR-001, BR-002, BR-047 | `createCheckinComment` | `okr` | `checkin_comments`, `notifications` | SD-14 | TC-UC14-01 … TC-UC14-02 |
| US15 | Must | UC15 | AC-UC15 | SCR-55 | BR-001, BR-002, BR-052 | `listTemplates`, `createTemplate`, `updateTemplate`, `duplicateTemplate` | `reviews` | `review_templates`, `review_criteria`, `review_questions` | SD-15 | TC-UC15-01 … TC-UC15-02 |
| US16 | Must | UC16 | AC-UC16 | SCR-53, SCR-54 | BR-001, BR-002, BR-050, BR-051, BR-055 | `listCampaigns`, `createCampaign`, `getCampaign`, `updateCampaign`, `openNomination`, `openCollection` | `reviews` | `review_campaigns`, `campaign_participants`, `review_assignments`, `okr_cycles` | SD-16 | TC-UC16-01 … TC-UC16-04 |
| US17 | Must | UC17 | AC-UC17 | SCR-22 | BR-001, BR-002, BR-053 | `listUserDirectory`, `getMyNomination`, `submitNomination` | `organization`, `reviews` | `nominations`, `nomination_peers`, `notifications` | SD-17 | TC-UC17-01 … TC-UC17-02 |
| US18 | Must | UC18 | AC-UC18 | SCR-23 | BR-001, BR-002, BR-003, BR-054 | `listPendingNominations`, `approveNomination` | `reviews` | `nominations`, `nomination_peers`, `review_assignments` | SD-18 | TC-UC18-01 … TC-UC18-03 |
| US19 | Must | UC19 | AC-UC19 | SCR-20, SCR-21 | BR-001, BR-002, BR-056, BR-057, BR-060 | `listMyReviewForms`, `getReviewForm`, `saveReviewDraft`, `checkReviewComment`, `submitReviewForm` | `reviews` | `review_assignments`, `review_answers`, `automation_daily_usage`, `audit_logs` | SD-19 | TC-UC19-01 … TC-UC19-05 |
| US20 | Must | UC20 | AC-UC20 | SCR-54 | BR-001, BR-002, BR-058, BR-061 | `getCampaignProgress`, `remindReviewers`, `closeCampaign` | `reviews` | `review_campaigns`, `review_assignments`, `review_answers`, `domain_events`, `notifications` | SD-20 | TC-UC20-01 … TC-UC20-03 |
| US21 | Must | UC21 | AC-UC21 | SCR-24 | BR-001, BR-002, BR-005, BR-059, BR-060, BR-062, BR-063 | `listReviewResultSubjects`, `getReviewResult` | `reviews` | `review_answers`, `campaign_participants`, `one_on_one_drafts` | SD-21 | TC-UC21-01 … TC-UC21-04 |
| US22 | Must | UC22 | AC-UC22 | SCR-30 | BR-001, BR-002, BR-070, BR-071, BR-072, BR-073, BR-074, BR-075 | `getMyFinalResult`, `calculateFinalResults`, `listFinalResults`, `exportFinalResults`, `publishFinalResults` | `results` | `final_results`, `review_campaigns`, `notifications` | SD-22 | TC-UC22-01 … TC-UC22-05 |
| US23 | Should | UC23 | AC-UC23 | SCR-02 | BR-001, BR-002 | `getMyDashboard`, `getTeamDashboard`, `getCompanyDashboard` | `results` | `objectives`, `key_results`, `checkins`, `review_assignments` | SD-23 | TC-UC23-01 … TC-UC23-04 |
| US24 | Should | UC24 | AC-UC24 | SCR-40 | BR-001, BR-002, BR-003, BR-005, BR-080 | `getReport`, `exportReport` | `results` | `objectives`, `checkins`, `final_results`, `audit_logs` | SD-24 | TC-UC24-01 … TC-UC24-04 |
| US25 | Should | UC25 | AC-UC25 | SCR-60 | BR-001, BR-002, BR-081, BR-082 | `listNotifications`, `markAllNotificationsRead`, `markNotificationRead` | `system`, `worker` | `notifications` | SD-25 | TC-UC25-01 … TC-UC25-02 |
| US26 | Should | UC26 | AC-UC26 | SCR-56 | BR-001, BR-002, BR-083 | `listAuditLogs` | `system` | `audit_logs` | SD-26 | TC-UC26-01 … TC-UC26-03 |
| US27 | Must | UC27 | AC-UC27 | SCR-83 | BR-001, BR-002, BR-098, BR-099 | `listAutomationFlows`, `updateAutomationFlow` | `automation` | `automation_flows`, `audit_logs` | SD-27 | TC-UC27-01 … TC-UC27-04 |
| US28 | Should | UC28 | AC-UC28 | SCR-83 | BR-001, BR-002, BR-100 | `listAutomationRuns`, `getAutomationRun`, `retryAutomationRun` | `automation` | `automation_runs` | SD-28 | TC-UC28-01 … TC-UC28-03 |
| US29 | Must | UC29 | AC-UC29 | SCR-80 | BR-001, BR-002, BR-091, BR-102, BR-103 | `listRoutedBlockers`, `acknowledgeBlocker`, `rejectBlocker` | `automation` | `checkin_insights`, `notifications` | SD-29 | TC-UC29-01 … TC-UC29-04 |
| US30 | Must | UC30 | AC-UC30 | SCR-12, SCR-81 | BR-001, BR-002, BR-091, BR-105 | `listWeeklyDigests`, `getWeeklyDigest` | `automation`, `worker` | `weekly_digests`, `automation_runs`, `notifications` | SD-30 | TC-UC30-01 … TC-UC30-04 |
| US31 | Must | UC31 | AC-UC31 | SCR-24, SCR-82 | BR-001, BR-002, BR-005, BR-091, BR-092, BR-094, BR-106 | `listOneOnOneDrafts`, `getOneOnOneDraft`, `updateOneOnOneDraft`, `sendOneOnOneDraft`, `discardOneOnOneDraft` | `automation` | `one_on_one_drafts`, `automation_runs`, `notifications` | SD-31 | TC-UC31-01 … TC-UC31-05 |
| US32 | Must | UC32 | AC-UC32 | SCR-12, SCR-80, SCR-81, SCR-82, SCR-83, SCR-84 | BR-001, BR-002, BR-090, BR-091, BR-093, BR-095, BR-096, BR-097, BR-098 | `getAiRunExplanation` | `automation`, `worker` | `domain_events`, `automation_runs`, `automation_daily_usage`, `checkin_insights`, `objective_review_notes`, `weekly_digests`, `one_on_one_drafts` | SD-32 | TC-UC32-01 … TC-UC32-09 |
| US33 | Should | UC08, UC12, UC32 | AC-UC32 | SCR-12 | BR-001, BR-002, BR-091, BR-104 | `listObjectiveReviewNotes`, `dismissObjectiveReviewNote`, `listCheckins` | `okr` | `objectives`, `key_results`, `domain_events`, `audit_logs`, `checkins`, `notifications`, `automation_runs`, `automation_daily_usage`, `checkin_insights`, `objective_review_notes`, `weekly_digests`, `one_on_one_drafts` | SD-08, SD-12, SD-32 | TC-UC08-01 … TC-UC08-04, TC-UC12-01 … TC-UC12-05, TC-UC32-01 … TC-UC32-09 |
| US34 | Should | UC19 | AC-UC19 | SCR-21 | BR-001, BR-002, BR-091, BR-094, BR-101 | `checkReviewComment` | `reviews` | `review_assignments`, `review_answers`, `automation_daily_usage`, `audit_logs` | SD-19 | TC-UC19-01 … TC-UC19-05 |

US32–US34 specify API operations dedicated to the AI subsystem. Background AI automation flows have no direct client API; they run inside `worker` as defined in [AI flows specification](architecture/ai-flows.md).

## Coverage Check

This section is verified against the table above. Any non-zero count indicates a design artifact not linked to a user story. Page `SCR-90` (403 Forbidden) is omitted here, as it serves as a shared generic error page for all stories when authorization fails (BR-002).

| Check | Result |
|---|---|
| Unmapped API operations | None |
| Unmapped business rules | None |
| Unmapped screens | None |
| Unused database tables | None |

**Related:** [User stories](08-invest-requirements.md) · [Use cases](03-use-cases.md) · [Acceptance criteria](06-acceptance-criteria.md) · [OpenAPI](api/openapi.yaml)
