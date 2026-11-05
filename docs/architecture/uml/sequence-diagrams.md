# Sequence Diagrams — OKR360 V1

> Design Status: TARGET V1
>
> Implementation Status: Design specification, not yet implemented

Each use case has a corresponding sequence diagram sharing the same number: SD-12 corresponds to UC12. The diagrams illustrate the interaction sequence among classes defined in the [class diagram](class-diagrams.md), including primary failure paths.

Conventions:

- Every request except login passes through `JwtAuthGuard` and `RolesGuard` before reaching the controller; this step is explicitly depicted only in SD-12 and SD-23.
- Errors are returned using the Problem Details format via `ProblemDetailsFilter`.
- Background AI flows share a common pipeline, fully illustrated in SD-32; SD-08, SD-12, SD-30, and SD-31 only depict steps specific to their respective flows.

| Code                                                     | Use case                                     | API                                                                        |
| -------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| [SD-01](#sd-01--login)                                   | UC01 Login                                   | `login`                                                                    |
| [SD-02](#sd-02--logout)                                  | UC02 Logout                                  | `logout`                                                                   |
| [SD-03](#sd-03--manage-personal-profile)                 | UC03 Manage personal profile                 | `getProfile`, `updateProfile`, `changePassword`                            |
| [SD-04](#sd-04--manage-departments-and-teams)            | UC04 Manage departments and teams            | `createDepartment`, `updateDepartment`, `deactivateDepartment`             |
| [SD-05](#sd-05--manage-users)                            | UC05 Manage users                            | `createUser`, `updateUser`, `updateUserStatus`                             |
| [SD-06](#sd-06--manage-okr-cycles)                       | UC06 Manage OKR cycles                       | `createCycle`, `activateCycle`, `closeCycle`                               |
| [SD-07](#sd-07--view-okr-tree)                           | UC07 View OKR tree                           | `getObjectiveTree`, `getObjective`                                         |
| [SD-08](#sd-08--createedit-objective)                    | UC08 Create/edit Objective                   | `createObjective`, `updateObjective`                                       |
| [SD-09](#sd-09--manage-key-results)                      | UC09 Manage Key Results                      | `createKeyResult`, `updateKeyResult`, `deleteKeyResult`                    |
| [SD-10](#sd-10--align-to-parent-objective)               | UC10 Align to parent objective               | `linkParentObjective`                                                      |
| [SD-11](#sd-11--soft-delete-okr)                         | UC11 Soft delete OKR                         | `deleteObjective`                                                          |
| [SD-12](#sd-12--check-in-key-result)                     | UC12 Check-in Key Result                     | `createCheckin`                                                            |
| [SD-13](#sd-13--view-check-in-history-and-progress-chart) | UC13 View check-in history and progress chart | `listCheckins`                                                             |
| [SD-14](#sd-14--comment-on-check-in)                     | UC14 Comment on check-in                     | `createCheckinComment`                                                     |
| [SD-15](#sd-15--manage-review-templates)                 | UC15 Manage review templates                 | `createTemplate`, `updateTemplate`, `duplicateTemplate`                    |
| [SD-16](#sd-16--create-and-launch-360-review-campaign)   | UC16 Create and launch 360 review campaign   | `createCampaign`, `openNomination`, `openCollection`                       |
| [SD-17](#sd-17--nominate-peers)                          | UC17 Nominate peers                          | `getMyNomination`, `submitNomination`                                      |
| [SD-18](#sd-18--approve-reviewers)                       | UC18 Approve reviewers                       | `listPendingNominations`, `approveNomination`                              |
| [SD-19](#sd-19--fill-review-form)                        | UC19 Fill review form                        | `checkReviewComment`, `submitReviewForm`                                   |
| [SD-20](#sd-20--monitor-review-progress-and-close-campaign) | UC20 Monitor review progress and close campaign | `getCampaignProgress`, `remindReviewers`, `closeCampaign`                  |
| [SD-21](#sd-21--view-360-review-results)                 | UC21 View 360 review results                 | `getReviewResult`                                                          |
| [SD-22](#sd-22--aggregate-and-publish-final-results)     | UC22 Aggregate and publish final results     | `calculateFinalResults`, `publishFinalResults`                             |
| [SD-23](#sd-23--view-dashboard)                          | UC23 View dashboard                          | `getMyDashboard`, `getTeamDashboard`, `getCompanyDashboard`                |
| [SD-24](#sd-24--view-and-export-reports)                 | UC24 View and export reports                 | `getReport`, `exportReport`                                                |
| [SD-25](#sd-25--receive-notifications-and-reminders)     | UC25 Receive notifications and reminders     | Worker, `listNotifications`, `markNotificationRead`                        |
| [SD-26](#sd-26--view-audit-logs)                         | UC26 View audit logs                         | `listAuditLogs`                                                            |
| [SD-27](#sd-27--configure-automation-flows)              | UC27 Configure automation flows              | `updateAutomationFlow`                                                     |
| [SD-28](#sd-28--view-automation-run-history)             | UC28 View automation run history             | `listAutomationRuns`, `getAutomationRun`, `retryAutomationRun`             |
| [SD-29](#sd-29--handle-routed-blockers)                  | UC29 Handle routed blockers                  | `acknowledgeBlocker`, `rejectBlocker`                                      |
| [SD-30](#sd-30--view-weekly-digest)                      | UC30 View weekly digest                      | Worker, `getWeeklyDigest`                                                  |
| [SD-31](#sd-31--review-1-on-1-draft)                     | UC31 Review 1-on-1 draft                     | Worker, `updateOneOnOneDraft`, `sendOneOnOneDraft`, `discardOneOnOneDraft` |
| [SD-32](#sd-32--execute-ai-automation-flow)              | UC32 Execute AI automation flow              | Worker                                                                     |

## SD-01 — Login

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web App
    participant C as AuthController
    participant L as LoginAttemptLimiter
    participant S as AuthService
    participant R as OrganizationRepository
    participant H as PasswordHasher
    participant T as TokenService

    U->>W: Enter email, password
    W->>C: POST /auth/login
    C->>S: login(email, password)
    S->>L: assertAllowed(email)
    alt More than 5 failed attempts in 15 minutes
        L-->>C: Rate limit exceeded error
        C-->>W: 429
    else Attempts remaining
        S->>R: findUserByEmail(email)
        S->>H: verify(password, hash)
        alt Invalid credentials or account locked
            S->>L: recordFailure(email)
            C-->>W: 401, identical generic error message
        else Valid credentials
            S->>L: reset(email)
            S->>T: sign(user)
            T-->>S: Token expires after 30 minutes
            C-->>W: 200 LoginResponse
            W-->>U: Navigate to Dashboard
        end
    end
```

## SD-02 — Logout

V1 does not revoke tokens on the server; the token automatically expires after 30 minutes.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web App
    participant C as AuthController

    U->>W: Click Logout
    W->>C: POST /auth/logout
    C-->>W: 204
    W->>W: Clear token and client-side session data
    W-->>U: Redirect to login page
```

## SD-03 — Manage Personal Profile

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web App
    participant C as ProfileController
    participant S as ProfileService
    participant H as PasswordHasher
    participant R as OrganizationRepository

    U->>W: Open Profile
    W->>C: GET /me
    C->>S: get(actor)
    C-->>W: 200 Profile
    U->>W: Edit full name, phone number, avatar
    W->>C: PATCH /me
    Note over C: DTO only accepts self-editable fields; email, role, department excluded
    C->>S: update(actor, input)
    S->>R: saveUser(user)
    C-->>W: 200 Profile
    U->>W: Enter current password and new password
    W->>C: POST /me/password
    C->>S: changePassword(actor, current, next)
    S->>H: verify(current, hash)
    alt Current password incorrect or new password under 8 characters
        C-->>W: 400
    else Valid
        S->>H: hash(next)
        S->>R: saveUser(user)
        C-->>W: 204
    end
```

## SD-04 — Manage Departments and Teams

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin, HR
    participant W as Web App
    participant C as DepartmentsController
    participant S as DepartmentService
    participant R as OrganizationRepository
    participant DB as PostgreSQL
    participant L as AuditLogService

    A->>W: Add or edit department, team
    W->>C: POST /departments or PATCH /departments/{id}
    C->>S: create(input) or update(id, input)
    S->>R: findDepartment(parentId)
    alt Team is not directly under a department
        C-->>W: 400
    else Valid structure
        S->>R: saveDepartment(unit)
        R->>DB: Trigger verifies cycles and unit types
        alt Cycle detected
            C-->>W: 409
        else Saved successfully
            S->>L: record(CREATE or UPDATE)
            C-->>W: 201 or 200 Department
        end
    end
    A->>W: Deactivate unit
    W->>C: POST /departments/{id}/deactivate
    C->>S: deactivate(id)
    S->>R: countActiveMembers(id)
    alt Active members remain
        C-->>W: 409
    else No active members
        S->>R: saveDepartment(isActive = false)
        C-->>W: 200 Department
    end
```

## SD-05 — Manage Users

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin, HR
    participant W as Web App
    participant C as UsersController
    participant S as UserService
    participant R as OrganizationRepository
    participant H as PasswordHasher
    participant DB as PostgreSQL
    participant L as AuditLogService

    A->>W: Enter user details
    W->>C: POST /users or PATCH /users/{id}
    C->>S: create(actor, input) or update(actor, id, input)
    alt HR assigns Admin role
        C-->>W: 403
    else Permitted
        S->>R: findUserByEmail(email)
        alt Email matches an active/undeleted account
            C-->>W: 409
        else Valid email
            S->>H: hash(initial password), on create only
            S->>R: saveUser(user)
            R->>DB: Trigger checks manager cycle
            alt Self-management or hierarchy cycle detected
                C-->>W: 409
            else Saved successfully
                S->>L: record(CREATE or UPDATE)
                C-->>W: 201 or 200 User
            end
        end
    end
    A->>W: Activate or deactivate account
    W->>C: PATCH /users/{id}/status
    C->>S: setActive(id, isActive)
    S->>R: saveUser(user)
    C-->>W: 200 User
```

- Deactivated accounts cannot log in and cannot be assigned as new reviewers (BR-014).

## SD-06 — Manage OKR Cycles

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin, HR
    participant W as Web App
    participant C as CyclesController
    participant S as CycleService
    participant R as OkrRepository
    participant DB as PostgreSQL

    A->>W: Create cycle
    W->>C: POST /cycles
    C->>S: create(input)
    alt End date is before start date
        C-->>W: 400
    else Valid
        S->>DB: Save cycle in DRAFT status
        C-->>W: 201 Cycle
    end
    A->>W: Activate cycle
    W->>C: POST /cycles/{id}/activate
    C->>S: activate(id)
    S->>DB: Transition to ACTIVE
    alt Another ACTIVE cycle exists, or invalid state transition
        DB-->>S: Unique index or trigger rejection
        C-->>W: 409
    else Activated
        C-->>W: 200 Cycle
    end
    A->>W: Close cycle
    W->>C: POST /cycles/{id}/close
    C->>S: close(id)
    Note over S,DB: Begin transaction
    S->>R: Finalize final_progress for all Objectives in cycle
    S->>DB: Transition to CLOSED
    Note over S,DB: Commit
    C-->>W: 200 Cycle
```

- Once closed, database triggers block all modifications to OKRs and check-ins within the cycle (BR-022).

## SD-07 — View OKR Tree

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web App
    participant C as ObjectivesController
    participant S as ObjectiveService
    participant R as OkrRepository
    participant DB as PostgreSQL

    U->>W: Select cycle, open OKR Tree
    W->>C: GET /objectives/tree?cycleId=...
    C->>S: tree(filter)
    S->>R: findTree(filter)
    R->>DB: Query vw_objective_tree, exclude soft-deleted OKRs
    S->>S: Construct nested tree, attach progress and confidence levels
    C-->>W: 200 ObjectiveTreeNode[]
    U->>W: Filter, expand, select an Objective
    W->>C: GET /objectives/{id}
    C->>S: get(id)
    C-->>W: 200 Objective with KRs, child Objectives, and review notes
```

## SD-08 — Create/Edit Objective

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web App
    participant C as ObjectivesController
    participant S as ObjectiveService
    participant P as AccessPolicy
    participant R as OkrRepository
    participant DB as PostgreSQL
    participant RU as ProgressRollup
    participant L as AuditLogService

    U->>W: Enter Objective and 1 to 5 Key Results, click save
    W->>C: POST /objectives
    C->>S: create(actor, input)
    S->>P: Validate OKR level against user role and unit ownership
    alt Unauthorized at this level
        C-->>W: 403
    else Permitted
        S->>R: findCycle(cycleId)
        alt Cycle is CLOSED
            C-->>W: 409
        else Exceeds maximum Objectives or missing unit
            C-->>W: 400
        else Valid
            Note over S,DB: Begin transaction
            S->>R: Save Objective and Key Results
            R->>DB: Trigger validates parent level and cycle
            R->>DB: Trigger inserts domain_events OBJECTIVE_CREATED
            opt Parent Objective exists
                S->>RU: recalculateFrom(parentId)
            end
            S->>L: record(CREATE)
            Note over S,DB: Commit
            C-->>W: 201 Objective
        end
    end
    Note over DB: Worker executes New OKR Review flow per SD-32, then attaches review notes
```

- Editing an Objective (`updateObjective`) follows the same pattern, without emitting events for AI.

## SD-09 — Manage Key Results

```mermaid
sequenceDiagram
    autonumber
    actor U as Owner
    participant W as Web App
    participant C as KeyResultsController
    participant S as KeyResultService
    participant P as AccessPolicy
    participant R as OkrRepository
    participant RU as ProgressRollup

    U->>W: Add, edit, or delete Key Result
    W->>C: POST, PATCH, or DELETE Key Result
    C->>S: create, update, or softDelete
    S->>P: Verify caller owns the Objective
    alt Unauthorized
        C-->>W: 403
    else Adding a 6th KR, or initial value equals target
        C-->>W: 400
    else Deleting the last KR of Objective, or cycle is closed
        C-->>W: 409
    else Valid
        Note over S,RU: Begin transaction
        S->>R: Save Key Result
        opt Changed start or target value, or added/removed KR
            S->>RU: recalculateFrom(objectiveId)
            Note over RU: Check-in history remains intact
        end
        Note over S,RU: Commit
        C-->>W: 201, 200, or 204
    end
```

## SD-10 — Align to Parent Objective

```mermaid
sequenceDiagram
    autonumber
    actor U as Owner
    participant W as Web App
    participant C as ObjectivesController
    participant S as ObjectiveService
    participant R as OkrRepository
    participant DB as PostgreSQL
    participant RU as ProgressRollup

    U->>W: Select parent Objective, or remove link
    W->>C: PUT /objectives/{id}/parent
    C->>S: linkParent(actor, id, parentId)
    S->>R: Read parent Objective
    alt Invalid level, mismatched cycle, or parent is soft-deleted
        C-->>W: 400
    else Valid
        Note over S,DB: Begin transaction
        S->>R: Update parent_id
        R->>DB: Trigger checks for cycle
        alt Cycle detected
            C-->>W: 409
        else Saved successfully
            S->>RU: recalculateFrom(oldParent)
            S->>RU: recalculateFrom(newParent)
            Note over S,DB: Commit
            C-->>W: 200 Objective
        end
    end
```

## SD-11 — Soft Delete OKR

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web App
    participant C as ObjectivesController
    participant S as ObjectiveService
    participant P as AccessPolicy
    participant R as OkrRepository
    participant RU as ProgressRollup
    participant L as AuditLogService

    U->>W: Click delete, confirm
    W->>C: DELETE /objectives/{id}
    C->>S: softDelete(actor, id)
    S->>P: Owner, unit Manager, or Admin
    alt Unauthorized
        C-->>W: 403
    else Child Objectives still linked
        C-->>W: 409
    else Valid
        Note over S,RU: Begin transaction
        S->>R: Set deleted_at, deleted_by
        S->>RU: recalculateFrom(parentId)
        S->>L: record(SOFT_DELETE)
        Note over S,RU: Commit
        C-->>W: 204
    end
```

## SD-12 — Check-in Key Result

All write steps execute within a single transaction. AI is not invoked here: triggers only log events; the background Worker processes them later (SD-32).

```mermaid
sequenceDiagram
    autonumber
    actor U as Assignee
    participant W as Web App
    participant G as JwtAuthGuard and RolesGuard
    participant C as CheckinsController
    participant S as CheckinService
    participant R as OkrRepository
    participant DB as PostgreSQL
    participant P as ProgressRollup
    participant N as NotificationService

    U->>W: Enter value, confidence level, note, blocker
    W->>G: POST /key-results/{id}/checkins
    G->>C: CurrentUser
    C->>S: create(actor, keyResultId, input)
    S->>R: findKeyResultForCheckin(keyResultId)
    alt Not the KR assignee
        C-->>W: 403
    else Cycle not ACTIVE
        C-->>W: 409
    else Valid
        Note over S,DB: Begin transaction
        S->>R: insertCheckin(input)
        R->>DB: INSERT checkins
        DB->>DB: Trigger updates KR current_value
        DB->>DB: Trigger inserts domain_events CHECKIN_CREATED
        S->>P: recalculateFrom(objectiveId)
        P->>R: findObjectiveChain(objectiveId)
        P->>R: updateObjectiveProgress for each Objective up to root
        opt Confidence is Off Track
            S->>N: notify(direct manager, CHECKIN_OFF_TRACK)
        end
        S->>DB: Write audit_logs
        Note over S,DB: Commit
        C-->>W: 201 CheckinResult with rolled-up Objectives
        W-->>U: Progress across all levels updates immediately
    end
```

## SD-13 — View Check-in History and Progress Chart

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web App
    participant C as CheckinsController
    participant S as CheckinService
    participant R as OkrRepository

    U->>W: Open a Key Result
    W->>C: GET /key-results/{id}/checkins
    C->>S: list(keyResultId)
    S->>R: Query check-ins newest first, with comments and AI insights
    C-->>W: 200 Checkin[]
    W->>W: Plot actual progress and expected timeline curve based on cycle dates
    W-->>U: View when the KR began stalling
```

## SD-14 — Comment on Check-in

```mermaid
sequenceDiagram
    autonumber
    actor M as Manager
    participant W as Web App
    participant C as CheckinsController
    participant S as CheckinService
    participant P as AccessPolicy
    participant R as OkrRepository
    participant N as NotificationService

    M->>W: Write comment on check-in
    W->>C: POST /checkins/{id}/comments
    C->>S: comment(actor, checkinId, body)
    S->>R: Read check-in and check-in author
    S->>P: isDirectManager(actor, author)
    alt Not direct manager
        C-->>W: 403
    else Valid
        S->>R: Save comment, check-in remains unmodified
        S->>N: notify(author, CHECKIN_COMMENT)
        C-->>W: 201 CheckinComment
    end
```

## SD-15 — Manage Review Templates

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR
    participant W as Web App
    participant C as ReviewTemplatesController
    participant S as TemplateService
    participant R as ReviewRepository

    HR->>W: Create or edit review template
    W->>C: POST /review-templates or PUT /review-templates/{id}
    C->>S: create(input) or update(id, input)
    alt No rating criteria provided
        C-->>W: 400
    else Modifying template used by non-DRAFT campaign
        C-->>W: 409, duplication required
    else Valid
        S->>R: Save template, criteria, open questions
        C-->>W: 201 or 200 ReviewTemplate
    end
    HR->>W: Duplicate locked template
    W->>C: POST /review-templates/{id}/duplicate
    C->>S: duplicate(id)
    S->>R: Duplicate into a new unlocked template
    C-->>W: 201 ReviewTemplate
```

## SD-16 — Create and Launch 360 Review Campaign

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR
    participant W as Web App
    participant C as CampaignsController
    participant S as CampaignService
    participant R as ReviewRepository
    participant DB as PostgreSQL

    HR->>W: Create campaign: template, reviewees, deadlines
    W->>C: POST /campaigns
    C->>S: create(input)
    alt Nomination deadline after submission deadline
        C-->>W: 400
    else Cycle already has a 360 campaign
        C-->>W: 409
    else Valid
        S->>R: Save campaign in DRAFT and participant list
        C-->>W: 201 Campaign
    end
    HR->>W: Open nomination
    W->>C: POST /campaigns/{id}/open-nomination
    C->>S: openNomination(id)
    S->>DB: Transition to NOMINATION, trigger enforces single-step transition
    C-->>W: 200 Campaign
    HR->>W: Open response collection
    W->>C: POST /campaigns/{id}/open-collection
    C->>S: openCollection(id)
    Note over S,DB: Begin transaction
    S->>DB: Transition to COLLECTING
    S->>R: Snapshot direct manager and department into campaign_participants
    S->>R: Generate Self, Manager, Direct Report assignments based on snapshot
    DB->>DB: Trigger locks cycle OKR/360 weight
    Note over S,DB: Commit
    C-->>W: 200 Campaign
```

- Peer group assignments are generated upon reviewer nomination approval (SD-18).

## SD-17 — Nominate Peers

```mermaid
sequenceDiagram
    autonumber
    actor U as Reviewee
    participant W as Web App
    participant C as NominationsController
    participant S as NominationService
    participant R as ReviewRepository
    participant N as NotificationService

    U->>W: Open Nominations
    W->>C: GET /campaigns/{id}/nominations/me
    C-->>W: 200 Nomination
    U->>W: Select 3 to 5 peers, click submit
    W->>C: PUT /campaigns/{id}/nominations/me
    C->>S: submit(actor, campaignId, peerIds)
    alt Campaign not in NOMINATION status
        C-->>W: 409
    else Includes self, manager, direct report, inactive user, or outside 3 to 5
        C-->>W: 400
    else Valid
        S->>R: Save nomination in PENDING status
        S->>N: notify(direct manager, NOMINATION_PENDING)
        C-->>W: 200 Nomination
    end
```

## SD-18 — Approve Reviewers

```mermaid
sequenceDiagram
    autonumber
    actor M as Manager, HR
    participant W as Web App
    participant C as NominationsController
    participant S as NominationService
    participant P as AccessPolicy
    participant R as ReviewRepository

    M->>W: Open Reviewer Approvals
    W->>C: GET /campaigns/{id}/nominations
    C-->>W: 200 Nomination[], including reviewees without nominations
    M->>W: Keep, add, or remove peers, click approve
    W->>C: POST /campaigns/{id}/nominations/{revieweeId}/approve
    C->>S: approve(actor, campaignId, revieweeId, peerIds)
    S->>P: Direct manager, or HR for reviewees without a manager
    alt Unauthorized
        C-->>W: 403
    else Campaign not in NOMINATION status
        C-->>W: 409
    else Not between 3 and 5 peers
        C-->>W: 400
    else Valid
        Note over S,R: Begin transaction
        S->>R: Nomination transitions to APPROVED
        S->>R: Generate Peer review assignments for each approved peer
        Note over S,R: Commit
        C-->>W: 200 Nomination
    end
```

## SD-19 — Fill Review Form

This flow executes synchronously within the API request without utilizing the outbox event queue and without persisting execution run logs.

```mermaid
sequenceDiagram
    autonumber
    actor U as Reviewer
    participant W as Web App
    participant C as ReviewFormsController
    participant G as CommentGuardService
    participant Q as QuotaGuard
    participant A as AiGateway
    participant F as ReviewFormService
    participant DB as PostgreSQL

    U->>W: Click Submit Form
    W->>C: POST /review-forms/{id}/comment-check
    C->>G: check(actor, formId, answers)
    G->>DB: Verify form belongs to caller, campaign is COLLECTING
    G->>Q: tryConsume(REVIEW_COMMENT_GUARD)
    alt Flow disabled, quota exceeded, or no open text comments
        C-->>W: 200, checked false
    else Allowed to run
        G->>A: complete(pseudonymized comments, max 5s timeout)
        alt AI error or timeout exceeded
            C-->>W: 200, checked false
        else Valid structured output returned
            Note over G: Discard items where flagged sentence is absent from source text
            C-->>W: 200, checked true, warning list
        end
    end
    opt Warnings detected
        W-->>U: Display flagged sentences, visible to author only
        U->>W: Edit feedback or select Submit Anyway
    end
    W->>C: POST /review-forms/{id}/submit
    C->>F: submit(actor, formId, input)
    alt Missing mandatory criteria
        C-->>W: 400
    else Complete
        F->>DB: Save answers, form transitions to SUBMITTED, audit log written without scores
        C-->>W: 200 ReviewForm
    end
```

- Warnings are never persisted anywhere; only `automation_daily_usage` increments by one call count (BR-101, NFR-PRIV-006).

## SD-20 — Monitor Review Progress and Close Campaign

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR
    participant W as Web App
    participant C as CampaignsController
    participant S as CampaignService
    participant R as ReviewRepository
    participant DB as PostgreSQL

    HR->>W: Click Close Campaign
    W->>C: POST /campaigns/{id}/close
    C->>S: close(id)
    alt Campaign not in COLLECTING status
        C-->>W: 409
    else Currently collecting
        Note over S,DB: Begin transaction
        S->>R: closeCampaign(id)
        R->>DB: SELECT close_review_campaign(id)
        DB->>DB: Campaign transitions to CLOSED
        DB->>DB: Purge answers for unsubmitted forms, assignments transition to CANCELLED
        DB->>DB: Set assignment_id = NULL across all answers
        DB->>DB: Trigger inserts domain_events CAMPAIGN_CLOSED
        S->>DB: Write audit_logs
        Note over S,DB: Commit
        C-->>W: 200 Campaign
    end
    Note over DB: Worker receives CAMPAIGN_CLOSED, generates 1-on-1 drafts for each reviewee per SD-32
```

- Once `assignment_id = NULL` is set, even an actor with full database read privileges cannot correlate scores back to individual reviewers (NFR-PRIV-001).

## SD-21 — View 360 Review Results

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web App
    participant C as ReviewResultsController
    participant S as ReviewResultService
    participant P as AccessPolicy
    participant R as ReviewRepository
    participant G as AnonymityAggregator

    U->>W: Open 360 Results
    W->>C: GET /campaigns/{id}/results/{revieweeId}
    C->>S: get(actor, campaignId, revieweeId)
    S->>P: canViewReviewResult(actor, campaign, revieweeId)
    Note over P: Self when PUBLISHED, direct manager via snapshot when CLOSED, HR always, Admin self only
    alt Unauthorized
        C-->>W: 403
    else Authorized
        S->>R: groupScores(campaignId, revieweeId)
        S->>R: visibleComments(campaignId, revieweeId)
        S->>G: aggregate(scores by group, comments)
        Note over G: Group < 3 reviews is merged; merged group < 3 is hidden and excluded from score
        G-->>S: ReviewResult, comments stripped of names and shuffled out of submission order
        S->>R: Retrieve sent 1-on-1 summary, if present
        C-->>W: 200 ReviewResult
    end
```

## SD-22 — Aggregate and Publish Final Results

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR
    participant W as Web App
    participant C as FinalResultsController
    participant S as FinalResultService
    participant RS as ReviewResultService
    participant K as ScoreCalculator
    participant N as NotificationService
    participant DB as PostgreSQL

    HR->>W: Click Aggregate Results
    W->>C: POST /cycles/{id}/final-results/calculate
    C->>S: calculate(cycleId)
    alt Cycle or campaign not CLOSED, or already published
        C-->>W: 409
    else Prerequisites met
        loop Each employee
            S->>DB: Read finalized individual OKR progress
            S->>RS: overallScore(campaignId, employee)
            S->>K: okrScore, finalScore, grade
        end
        S->>DB: Overwrite final_results
        C-->>W: 200 FinalResultSummary
    end
    HR->>W: Preview, then click Publish
    W->>C: POST /cycles/{id}/final-results/publish
    C->>S: publish(cycleId)
    Note over S,DB: Begin transaction
    S->>DB: Campaign transitions to PUBLISHED, record published_at
    loop Each employee
        S->>N: notify(employee, RESULT_PUBLISHED)
    end
    Note over S,DB: Commit
    C-->>W: 200 PublishResult
```

- AI does not participate in any step of this flow.

## SD-23 — View Dashboard

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web App
    participant G as RolesGuard
    participant C as DashboardsController
    participant S as DashboardService
    participant P as AccessPolicy
    participant DB as PostgreSQL

    U->>W: Open home page, select cycle
    W->>C: GET /dashboards/me
    C->>S: personal(actor, cycleId)
    S->>DB: My OKR progress, KRs needing check-in, pending review forms
    C-->>W: 200 MyDashboard
    opt Caller is Manager
        W->>G: GET /dashboards/team
        G->>C: Role MANAGER
        C->>S: team(actor, cycleId)
        S->>P: managedUnitIds(actor)
        S->>DB: Unit progress, members with missing check-ins, at-risk OKRs
        C-->>W: 200 TeamDashboard
    end
    opt Caller is Admin or HR
        W->>C: GET /dashboards/company
        C->>S: company(cycleId)
        C-->>W: 200 CompanyDashboard
    end
```

## SD-24 — View and Export Reports

```mermaid
sequenceDiagram
    autonumber
    actor U as Admin, HR, Manager
    participant W as Web App
    participant C as ReportsController
    participant S as ReportService
    participant P as AccessPolicy
    participant E as ReportExporter
    participant L as AuditLogService

    U->>W: Select report type, cycle, department
    W->>C: GET /reports/{type}
    C->>S: build(actor, type, filter)
    alt Admin selects FINAL_RESULTS
        C-->>W: 403
    else Authorized
        S->>P: Unit scope of caller
        Note over S: Manager only views own unit; for FINAL_RESULTS, direct reports only
        C-->>W: 200 Report
    end
    U->>W: Click Export Excel or PDF
    W->>C: GET /reports/{type}/export?format=XLSX
    C->>S: build(actor, type, filter)
    C->>E: export(report)
    C->>L: record(EXPORT)
    C-->>W: File matching currently displayed data
```

## SD-25 — Receive Notifications and Reminders

The reminder processing runs in the background Worker without AI.

```mermaid
sequenceDiagram
    autonumber
    participant SC as WorkerScheduler
    participant J as ReminderJob
    participant N as NotificationService
    participant DB as PostgreSQL
    participant E as EmailSender
    participant SM as SMTP Server
    actor U as User
    participant W as Web App
    participant C as NotificationsController

    SC->>J: run() on schedule
    J->>DB: Find KRs unchecked for 7 days, unsubmitted nominations, unsubmitted forms
    loop Each due item
        J->>N: notify(user, type, dedupeKey by date)
        N->>DB: INSERT notifications, skip if dedupeKey duplicates
    end
    SC->>E: sendPending()
    E->>DB: Read notifications pending email dispatch
    E->>SM: Send email
    E->>DB: Record email_sent_at
    U->>W: Open notifications bell
    W->>C: GET /notifications
    C-->>W: 200 NotificationPage
    U->>W: Mark as read
    W->>C: POST /notifications/{id}/read
    C-->>W: 200 Notification
```

## SD-26 — View Audit Logs

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin, HR
    participant W as Web App
    participant C as AuditLogsController
    participant S as AuditLogService
    participant DB as PostgreSQL

    A->>W: Open Audit Logs, select filters
    W->>C: GET /audit-logs
    C->>S: list(filter)
    S->>DB: Read audit_logs by actor, module, action, timestamp
    C-->>W: 200 AuditLogPage, without form answers or anonymous reviewer-reviewee pairs
```

## SD-27 — Configure Automation Flows

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant W as Web App
    participant C as AutomationController
    participant S as AutomationConfigService
    participant R as AutomationRepository
    participant L as AuditLogService

    A->>W: Open Automation
    W->>C: GET /automation/flows
    C-->>W: 200 AutomationFlowConfig[]
    A->>W: Enable/disable, edit schedule, quota, click save
    W->>C: PATCH /automation/flows/{flow}
    C->>S: update(flow, input)
    alt Quota non-positive or schedule invalid format
        C-->>W: 400
    else Enabling flow without configured AI service key
        C-->>W: 409
    else Valid
        S->>R: Save configuration
        S->>L: record(UPDATE, old and new values)
        C-->>W: 200 AutomationFlowConfig
    end
    Note over R: When flow is disabled, new events for flow are marked SKIPPED (SD-32)
```

## SD-28 — View Automation Run History

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin, HR
    participant W as Web App
    participant C as AutomationController
    participant S as RunHistoryService
    participant R as AutomationRepository

    A->>W: Open Run History, filter
    W->>C: GET /automation/runs
    C-->>W: 200 AutomationRunPage
    A->>W: Open a run execution
    W->>C: GET /automation/runs/{id}
    C->>R: findRun(id)
    C-->>W: 200 AutomationRun, contains technical metrics only
    A->>W: Click Retry
    W->>C: POST /automation/runs/{id}/retry
    alt Caller is HR
        C-->>W: 403
    else Run not in FAILED status
        C-->>W: 409
    else Valid
        C->>S: retry(runId)
        S->>R: Reset run to pending, retry immediately
        C-->>W: 200 AutomationRun
    end
    Note over R: FlowRunner.retryDue() picks up this run per SD-32
```

## SD-29 — Handle Routed Blockers

### Sending the blocker

The Worker has already written the AI suggestion (SD-32). Nothing reaches the unit head until the person who checked in confirms (BR-107).

```mermaid
sequenceDiagram
    autonumber
    actor A as Person who checked in
    participant W as Web App
    participant C as BlockersController
    participant S as BlockerService
    participant R as AutomationRepository
    participant N as NotificationService

    A->>W: Click Send, or pick another unit and send
    W->>C: POST /checkins/{checkinId}/blocker/send
    C->>S: send(actor, checkinId, unitId)
    alt Not the person who checked in
        C-->>W: 403
    else Already sent or dismissed
        C-->>W: 409
    else Own unit or the department containing their team
        C-->>W: 400
    else Valid
        S->>R: Save chosen unit and confirmation time, routing OPEN
        S->>N: notify(head of chosen unit, BLOCKER_ROUTED)
        C-->>W: 200 CheckinInsight
    end
    opt Click Do not send instead
        W->>C: POST /checkins/{checkinId}/blocker/dismiss
        C->>S: dismiss(actor, checkinId)
        S->>R: routing DISMISSED, nobody is notified
        C-->>W: 200 CheckinInsight
    end
```

### Handling the blocker

```mermaid
sequenceDiagram
    autonumber
    actor H as Department Head
    participant W as Web App
    participant C as BlockersController
    participant S as BlockerService
    participant P as AccessPolicy
    participant R as AutomationRepository
    participant N as NotificationService

    H->>W: Open Routed Blockers, select a blocker
    alt Acknowledge resolution
        W->>C: POST /blockers/{checkinId}/acknowledge
        C->>S: acknowledge(actor, checkinId, note)
    else Not relevant to my department
        W->>C: POST /blockers/{checkinId}/reject
        C->>S: reject(actor, checkinId, note)
    end
    S->>R: findInsight(checkinId)
    S->>P: managesUnit(actor, targetDepartment)
    alt Does not manage that unit
        C-->>W: 403
    else Blocker already resolved/handled
        C-->>W: 409
    else Valid
        S->>R: Update routing status and note, AI labels remain unchanged
        alt Acknowledged
            S->>N: notify(check-in author, BLOCKER_UPDATED)
        else Rejected
            S->>N: notify(author direct manager, BLOCKER_ROUTED)
            Note over S: Record an AI misclassification occurrence
        end
        C-->>W: 200 RoutedBlocker
    end
```

## SD-30 — View Weekly Digest

```mermaid
sequenceDiagram
    autonumber
    participant SC as WorkerScheduler
    participant F as FlowRunner
    participant H as WeeklyDigestFlow
    participant A as AiGateway
    participant DB as PostgreSQL
    actor M as Manager
    participant W as Web App
    participant C as WeeklyDigestsController
    participant S as DigestService

    SC->>F: 8:00 AM Monday, one run per Manager
    F->>DB: createRun("user:{id}:week:{Monday}"), stop if duplicate
    F->>H: buildRequest(manager)
    H->>DB: Calculate prior week metrics via SQL query
    alt No notes or blockers present
        Note over H: Skip AI call
    else Text content present
        F->>A: complete(notes and blockers pseudonymized with identifiers)
        A-->>F: Up to 3 attention items, schema verified
    end
    F->>H: apply(result)
    H->>DB: Write weekly_digests and WEEKLY_DIGEST notification
    Note over DB: EmailSender dispatches email per SD-25
    M->>W: Open Weekly Digest
    W->>C: GET /weekly-digests/{id}
    C->>S: get(actor, id)
    S->>DB: Record read_at on first view
    C-->>W: 200 WeeklyDigest
```

- Metrics are computed directly via queries; AI only authors key attention items (BR-105). Errors and retries follow SD-32.

## SD-31 — Review 1-on-1 Draft

```mermaid
sequenceDiagram
    autonumber
    participant F as FlowRunner
    participant H as OneOnOneDraftFlow
    participant A as AiGateway
    participant DB as PostgreSQL
    actor M as Manager, HR
    participant W as Web App
    participant C as OneOnOneDraftsController
    participant S as OneOnOneDraftService
    participant P as AccessPolicy
    participant N as NotificationService

    Note over F: Following CAMPAIGN_CLOSED event, one run per reviewee
    F->>H: shouldSkip(reviewee)
    alt No group meets threshold, or no open text comments
        Note over H: Skip AI call, do not generate draft
    else Comments present
        F->>A: complete(pseudonymized feedback, excluding scores and reviewer identities)
        A-->>F: Strengths, improvement areas, no verbatim quotes
        F->>H: apply(result)
        H->>DB: Write one_on_one_drafts in Pending Review status
        H->>DB: AI_DRAFT_READY notification to approver
    end
    M->>W: Open draft, edit content
    W->>C: PATCH /one-on-one-drafts/{id}
    C->>S: edit(actor, id, text)
    S->>P: Manager via snapshot, or HR for reviewees without a manager
    alt Not the assigned approver
        C-->>W: 403
    else Draft already sent or discarded
        C-->>W: 409
    else Valid
        S->>DB: Save edited_text, original AI proposals preserved immutable
        C-->>W: 200 OneOnOneDraft
    end
    alt Send to employee
        W->>C: POST /one-on-one-drafts/{id}/send
        C->>S: send(actor, id)
        alt Campaign not PUBLISHED
            C-->>W: 409
        else Published
            S->>DB: Status SENT, record sender and timestamp
            S->>N: notify(employee, ONE_ON_ONE_SENT)
            C-->>W: 200 OneOnOneDraft
        end
    else Discard draft
        W->>C: POST /one-on-one-drafts/{id}/discard
        C->>S: discard(actor, id)
        C-->>W: 200 OneOnOneDraft
    end
```

- Employees only see the approved content within the "Manager Summary" section of 360 results (SD-21, BR-092).

## SD-32 — Execute AI Automation Flow

Example illustrated with the Blocker Routing flow; the four other background flows differ only in their `AutomationFlowHandler`. The Weekly Digest begins from `WorkerScheduler` rather than `OutboxPoller`.

```mermaid
sequenceDiagram
    autonumber
    participant O as OutboxPoller
    participant F as FlowRunner
    participant Q as QuotaGuard
    participant RR as AutomationRunRepository
    participant H as BlockerRoutingFlow
    participant A as AiGateway
    participant M as Masker
    participant P as AiProvider
    participant V as OutputValidator
    participant DB as PostgreSQL

    loop Every 30 seconds
        O->>DB: Fetch unprocessed domain_events, FOR UPDATE SKIP LOCKED
        O->>F: run(handler, event)
        F->>Q: tryConsume(BLOCKER_ROUTING)
        alt Flow disabled or quota exceeded
            F->>RR: markFinished(SKIPPED)
        else Allowed to run
            F->>RR: createRun(flow, "checkin:21")
            alt run_key already exists
                Note over F: Stop, avoid duplicate execution
            else New run execution
                F->>H: shouldSkip(check-in)
                alt Check-in contains no blocker
                    F->>RR: markFinished(SKIPPED)
                else Blocker present
                    F->>H: buildRequest(check-in)
                    H->>DB: Read blocker and department directory
                    F->>A: complete(request)
                    A->>M: mask(data)
                    Note over A,P: Out-of-transaction call, max 30s timeout
                    A->>P: send(prompt with identifiers masked)
                    alt AI error or timeout exceeded
                        A-->>F: error
                        F->>RR: markRetry(after 1, 5, or 15 minutes)
                        Note over F: 4th consecutive error marks finished as FAILED
                    else AI returns JSON
                        A->>V: validate(raw, schema, valid department IDs)
                        alt Invalid schema
                            F->>RR: markFinished(FAILED)
                        else Valid schema
                            A->>M: unmask(result)
                            Note over F,DB: New transaction
                            F->>H: apply(result)
                            H->>DB: Write checkin_insights
                            H->>DB: Write the send suggestion for the person who checked in (BLOCKER_SUGGESTED)
                            F->>RR: markFinished(SUCCEEDED, token count)
                            F->>DB: Mark event processed_at
                            Note over F,DB: Commit
                        end
                    end
                end
            end
        end
    end
```

- Masking mappings reside strictly in memory for the duration of the run; `automation_runs` contains neither the outgoing payload nor the AI response (BR-093, BR-100).
- Runs pending retry are retrieved by `FlowRunner.retryDue()` once `next_attempt_at` is reached.

**Related:** [Class Diagrams](class-diagrams.md) · [AI Flow Specification](../arc42/ai-flows.md) · [C4 Architecture](../c4/README.md) · [Use Cases](../../03-use-cases.md)
