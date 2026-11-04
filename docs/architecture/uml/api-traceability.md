# API to UML Traceability — OKR360 V1

Every OpenAPI operation, the controller method that implements it in the [class diagrams](class-diagrams.md), and the [sequence diagram](sequence-diagrams.md) that shows it. The controller method has the same name as the `operationId`.

Total: 89 operations, all with a controller method.

## Login

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `login` | `POST /auth/login` | `AuthController` | UC01 | SD-01 | Public |
| `logout` | `POST /auth/logout` | `AuthController` | UC02 | SD-02 | ADMIN, HR, MANAGER, EMPLOYEE |

## Profile

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `getProfile` | `GET /me` | `ProfileController` | UC03 | SD-03 | ADMIN, HR, MANAGER, EMPLOYEE |
| `updateProfile` | `PATCH /me` | `ProfileController` | UC03 | SD-03 | ADMIN, HR, MANAGER, EMPLOYEE |
| `changePassword` | `POST /me/password` | `ProfileController` | UC03 | SD-03 | ADMIN, HR, MANAGER, EMPLOYEE |

## Final Results

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `getMyFinalResult` | `GET /me/final-results` | `FinalResultsController` | UC22 | SD-22 | ADMIN, HR, MANAGER, EMPLOYEE |
| `calculateFinalResults` | `POST /cycles/{cycleId}/final-results/calculate` | `FinalResultsController` | UC22 | SD-22 | HR |
| `listFinalResults` | `GET /cycles/{cycleId}/final-results` | `FinalResultsController` | UC22 | SD-22 | HR |
| `exportFinalResults` | `GET /cycles/{cycleId}/final-results/export` | `FinalResultsController` | UC22 | SD-22 | HR |
| `publishFinalResults` | `POST /cycles/{cycleId}/final-results/publish` | `FinalResultsController` | UC22 | SD-22 | HR |

## Organization

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listDepartments` | `GET /departments` | `DepartmentsController` | UC04 | SD-04 | ADMIN, HR, MANAGER, EMPLOYEE |
| `createDepartment` | `POST /departments` | `DepartmentsController` | UC04 | SD-04 | ADMIN, HR |
| `updateDepartment` | `PATCH /departments/{departmentId}` | `DepartmentsController` | UC04 | SD-04 | ADMIN, HR |
| `deactivateDepartment` | `POST /departments/{departmentId}/deactivate` | `DepartmentsController` | UC04 | SD-04 | ADMIN, HR |

## Users

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listUsers` | `GET /users` | `UsersController` | UC05 | SD-05 | ADMIN, HR |
| `createUser` | `POST /users` | `UsersController` | UC05 | SD-05 | ADMIN, HR |
| `listUserDirectory` | `GET /users/directory` | `UsersController` | UC17 | SD-17 | ADMIN, HR, MANAGER, EMPLOYEE |
| `getUser` | `GET /users/{userId}` | `UsersController` | UC05 | SD-05 | ADMIN, HR |
| `updateUser` | `PATCH /users/{userId}` | `UsersController` | UC05 | SD-05 | ADMIN, HR |
| `updateUserStatus` | `PATCH /users/{userId}/status` | `UsersController` | UC05 | SD-05 | ADMIN, HR |

## Cycles

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listCycles` | `GET /cycles` | `CyclesController` | UC06 | SD-06 | ADMIN, HR, MANAGER, EMPLOYEE |
| `createCycle` | `POST /cycles` | `CyclesController` | UC06 | SD-06 | ADMIN, HR |
| `updateCycle` | `PATCH /cycles/{cycleId}` | `CyclesController` | UC06 | SD-06 | ADMIN, HR |
| `activateCycle` | `POST /cycles/{cycleId}/activate` | `CyclesController` | UC06 | SD-06 | ADMIN, HR |
| `closeCycle` | `POST /cycles/{cycleId}/close` | `CyclesController` | UC06 | SD-06 | ADMIN, HR |

## OKR

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listObjectives` | `GET /objectives` | `ObjectivesController` | UC07 | SD-07 | ADMIN, HR, MANAGER, EMPLOYEE |
| `createObjective` | `POST /objectives` | `ObjectivesController` | UC08 | SD-08 | ADMIN, HR, MANAGER, EMPLOYEE |
| `getObjectiveTree` | `GET /objectives/tree` | `ObjectivesController` | UC07 | SD-07 | ADMIN, HR, MANAGER, EMPLOYEE |
| `getObjective` | `GET /objectives/{objectiveId}` | `ObjectivesController` | UC07 | SD-07 | ADMIN, HR, MANAGER, EMPLOYEE |
| `updateObjective` | `PATCH /objectives/{objectiveId}` | `ObjectivesController` | UC08 | SD-08 | ADMIN, HR, MANAGER, EMPLOYEE |
| `deleteObjective` | `DELETE /objectives/{objectiveId}` | `ObjectivesController` | UC11 | SD-11 | ADMIN, HR, MANAGER, EMPLOYEE |
| `linkParentObjective` | `PUT /objectives/{objectiveId}/parent` | `ObjectivesController` | UC10 | SD-10 | ADMIN, HR, MANAGER, EMPLOYEE |
| `listObjectiveReviewNotes` | `GET /objectives/{objectiveId}/review-notes` | `ObjectivesController` | UC08 | SD-08 | ADMIN, HR, MANAGER, EMPLOYEE |
| `dismissObjectiveReviewNote` | `POST /objectives/{objectiveId}/review-notes/{noteId}/dismiss` | `ObjectivesController` | UC08 | SD-08 | ADMIN, HR, MANAGER, EMPLOYEE |
| `createKeyResult` | `POST /objectives/{objectiveId}/key-results` | `KeyResultsController` | UC09 | SD-09 | ADMIN, HR, MANAGER, EMPLOYEE |
| `updateKeyResult` | `PATCH /key-results/{keyResultId}` | `KeyResultsController` | UC09 | SD-09 | ADMIN, HR, MANAGER, EMPLOYEE |
| `deleteKeyResult` | `DELETE /key-results/{keyResultId}` | `KeyResultsController` | UC09 | SD-09 | ADMIN, HR, MANAGER, EMPLOYEE |

## Check-in

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listCheckins` | `GET /key-results/{keyResultId}/checkins` | `CheckinsController` | UC13 | SD-13 | ADMIN, HR, MANAGER, EMPLOYEE |
| `createCheckin` | `POST /key-results/{keyResultId}/checkins` | `CheckinsController` | UC12 | SD-12 | ADMIN, HR, MANAGER, EMPLOYEE |
| `createCheckinComment` | `POST /checkins/{checkinId}/comments` | `CheckinsController` | UC14 | SD-14 | MANAGER |

## 360 Form Templates

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listTemplates` | `GET /review-templates` | `ReviewTemplatesController` | UC15 | SD-15 | HR |
| `createTemplate` | `POST /review-templates` | `ReviewTemplatesController` | UC15 | SD-15 | HR |
| `updateTemplate` | `PUT /review-templates/{templateId}` | `ReviewTemplatesController` | UC15 | SD-15 | HR |
| `duplicateTemplate` | `POST /review-templates/{templateId}/duplicate` | `ReviewTemplatesController` | UC15 | SD-15 | HR |

## 360 Rounds

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listCampaigns` | `GET /campaigns` | `CampaignsController` | UC16 | SD-16 | ADMIN, HR, MANAGER, EMPLOYEE |
| `createCampaign` | `POST /campaigns` | `CampaignsController` | UC16 | SD-16 | HR |
| `getCampaign` | `GET /campaigns/{campaignId}` | `CampaignsController` | UC16 | SD-16 | ADMIN, HR, MANAGER, EMPLOYEE |
| `updateCampaign` | `PATCH /campaigns/{campaignId}` | `CampaignsController` | UC16 | SD-16 | HR |
| `openNomination` | `POST /campaigns/{campaignId}/open-nomination` | `CampaignsController` | UC16 | SD-16 | HR |
| `openCollection` | `POST /campaigns/{campaignId}/open-collection` | `CampaignsController` | UC16 | SD-16 | HR |
| `getCampaignProgress` | `GET /campaigns/{campaignId}/progress` | `CampaignsController` | UC20 | SD-20 | HR |
| `remindReviewers` | `POST /campaigns/{campaignId}/remind` | `CampaignsController` | UC20 | SD-20 | HR |
| `closeCampaign` | `POST /campaigns/{campaignId}/close` | `CampaignsController` | UC20 | SD-20 | HR |

## Nominations

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `getMyNomination` | `GET /campaigns/{campaignId}/nominations/me` | `NominationsController` | UC17 | SD-17 | ADMIN, HR, MANAGER, EMPLOYEE |
| `submitNomination` | `PUT /campaigns/{campaignId}/nominations/me` | `NominationsController` | UC17 | SD-17 | ADMIN, HR, MANAGER, EMPLOYEE |
| `listPendingNominations` | `GET /campaigns/{campaignId}/nominations` | `NominationsController` | UC18 | SD-18 | MANAGER, HR |
| `approveNomination` | `POST /campaigns/{campaignId}/nominations/{revieweeUserId}/approve` | `NominationsController` | UC18 | SD-18 | MANAGER, HR |

## 360 Forms

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listMyReviewForms` | `GET /review-forms` | `ReviewFormsController` | UC19 | SD-19 | ADMIN, HR, MANAGER, EMPLOYEE |
| `getReviewForm` | `GET /review-forms/{formId}` | `ReviewFormsController` | UC19 | SD-19 | ADMIN, HR, MANAGER, EMPLOYEE |
| `saveReviewDraft` | `PUT /review-forms/{formId}/draft` | `ReviewFormsController` | UC19 | SD-19 | ADMIN, HR, MANAGER, EMPLOYEE |
| `checkReviewComment` | `POST /review-forms/{formId}/comment-check` | `ReviewFormsController` | UC19 | SD-19 | ADMIN, HR, MANAGER, EMPLOYEE |
| `submitReviewForm` | `POST /review-forms/{formId}/submit` | `ReviewFormsController` | UC19 | SD-19 | ADMIN, HR, MANAGER, EMPLOYEE |

## 360 Results

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listReviewResultSubjects` | `GET /campaigns/{campaignId}/results` | `ReviewResultsController` | UC21 | SD-21 | ADMIN, HR, MANAGER, EMPLOYEE |
| `getReviewResult` | `GET /campaigns/{campaignId}/results/{revieweeUserId}` | `ReviewResultsController` | UC21 | SD-21 | ADMIN, HR, MANAGER, EMPLOYEE |

## Dashboard

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `getMyDashboard` | `GET /dashboards/me` | `DashboardsController` | UC23 | SD-23 | ADMIN, HR, MANAGER, EMPLOYEE |
| `getTeamDashboard` | `GET /dashboards/team` | `DashboardsController` | UC23 | SD-23 | MANAGER |
| `getCompanyDashboard` | `GET /dashboards/company` | `DashboardsController` | UC23 | SD-23 | ADMIN, HR |

## Reports

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `getReport` | `GET /reports/{reportType}` | `ReportsController` | UC24 | SD-24 | ADMIN, HR, MANAGER |
| `exportReport` | `GET /reports/{reportType}/export` | `ReportsController` | UC24 | SD-24 | ADMIN, HR, MANAGER |

## Notifications

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listNotifications` | `GET /notifications` | `NotificationsController` | UC25 | SD-25 | ADMIN, HR, MANAGER, EMPLOYEE |
| `markAllNotificationsRead` | `POST /notifications/read-all` | `NotificationsController` | UC25 | SD-25 | ADMIN, HR, MANAGER, EMPLOYEE |
| `markNotificationRead` | `POST /notifications/{notificationId}/read` | `NotificationsController` | UC25 | SD-25 | ADMIN, HR, MANAGER, EMPLOYEE |

## Audit Log

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listAuditLogs` | `GET /audit-logs` | `AuditLogsController` | UC26 | SD-26 | ADMIN, HR |

## Automation

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listAutomationFlows` | `GET /automation/flows` | `AutomationController` | UC27 | SD-27 | ADMIN, HR |
| `updateAutomationFlow` | `PATCH /automation/flows/{flow}` | `AutomationController` | UC27 | SD-27 | ADMIN |
| `listAutomationRuns` | `GET /automation/runs` | `AutomationController` | UC28 | SD-28 | ADMIN, HR |
| `getAutomationRun` | `GET /automation/runs/{runId}` | `AutomationController` | UC28 | SD-28 | ADMIN, HR |
| `retryAutomationRun` | `POST /automation/runs/{runId}/retry` | `AutomationController` | UC28 | SD-28 | ADMIN |
| `getAiRunExplanation` | `GET /automation/runs/{runId}/explanation` | `AutomationController` | UC32 | SD-32 | ADMIN, HR, MANAGER, EMPLOYEE |

## Blockers

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listRoutedBlockers` | `GET /blockers` | `BlockersController` | UC29 | SD-29 | ADMIN, HR, MANAGER |
| `acknowledgeBlocker` | `POST /blockers/{checkinId}/acknowledge` | `BlockersController` | UC29 | SD-29 | ADMIN, HR, MANAGER |
| `rejectBlocker` | `POST /blockers/{checkinId}/reject` | `BlockersController` | UC29 | SD-29 | ADMIN, HR, MANAGER |

## Weekly Digests

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listWeeklyDigests` | `GET /weekly-digests` | `WeeklyDigestsController` | UC30 | SD-30 | MANAGER |
| `getWeeklyDigest` | `GET /weekly-digests/{digestId}` | `WeeklyDigestsController` | UC30 | SD-30 | MANAGER |

## 1-1 Drafts

| operationId | Method and path | Controller | Use case | Sequence | Roles |
|---|---|---|---|---|---|
| `listOneOnOneDrafts` | `GET /one-on-one-drafts` | `OneOnOneDraftsController` | UC31 | SD-31 | MANAGER, HR |
| `getOneOnOneDraft` | `GET /one-on-one-drafts/{draftId}` | `OneOnOneDraftsController` | UC31 | SD-31 | MANAGER, HR |
| `updateOneOnOneDraft` | `PATCH /one-on-one-drafts/{draftId}` | `OneOnOneDraftsController` | UC31 | SD-31 | MANAGER, HR |
| `sendOneOnOneDraft` | `POST /one-on-one-drafts/{draftId}/send` | `OneOnOneDraftsController` | UC31 | SD-31 | MANAGER, HR |
| `discardOneOnOneDraft` | `POST /one-on-one-drafts/{draftId}/discard` | `OneOnOneDraftsController` | UC31 | SD-31 | MANAGER, HR |

**Related:** [Class diagrams](class-diagrams.md) · [Sequence diagrams](sequence-diagrams.md) · [OpenAPI](../../api/openapi.yaml) · [Traceability matrix](../../traceability.md)
