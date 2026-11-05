# OKR360 — Database Diagrams

This is the target database design (PostgreSQL 15+, schema `okr360`). Design rationale and details are documented in [05-data-model.md](05-data-model.md). The SQL schema itself is written in increment I1 of the [implementation plan](09-implementation-plan.md), following this document.

## Entity Relationship Overview

The diagram divides the 27 tables into five groups. Arrows point from parent tables to child tables; labels describe the foreign key relationships.

```mermaid
flowchart TB
    subgraph ORG["Organization"]
        direction LR
        DEP["departments<br/>departments + teams"] -->|belongs to unit| USR["app_users"]
        DEP -->|parent unit| DEP
        USR -->|direct manager| USR
    end

    subgraph OKR["OKR"]
        direction LR
        CYC["okr_cycles"] -->|in cycle| OBJ["objectives"]
        OBJ -->|parent objective| OBJ
        OBJ -->|1–5 KRs| KR["key_results"]
        KR -->|history| CHK["checkins"]
        CHK -->|comments| CMT["checkin_comments"]
    end

    subgraph REV["360 Review"]
        direction LR
        TPL["review_templates"] --> CRI["review_criteria"]
        TPL --> QST["review_questions"]
        TPL -->|uses template| CMP["review_campaigns"]
        CMP --> PAR["campaign_participants"]
        CMP --> NOM["nominations"] --> NPE["nomination_peers"]
        CMP --> ASG["review_assignments"]
        ASG -.->|detached on campaign close| ANS["review_answers"]
        CRI --> ANS
        QST --> ANS
    end

    subgraph SYS["Results & System"]
        direction LR
        FIN["final_results"]
        NOT["notifications"]
        AUD["audit_logs"]
    end

    ORG ==>|owner, assignee, check-in user| OKR
    ORG ==>|reviewee, reviewer| REV
    CYC -->|max 1 campaign| CMP
    CYC -->|cycle final results| FIN
    subgraph AI["AI Automation"]
        direction LR
        FLW["automation_flows"] --> RUN["automation_runs"]
        FLW --> USE["automation_daily_usage"]
        EVT["domain_events"] --> RUN
        RUN --> INS["checkin_insights"]
        RUN --> RVN["objective_review_notes"]
        RUN --> DIG["weekly_digests"]
        RUN --> DRF["one_on_one_drafts"]
    end

    ORG ==>|recipient, actor| SYS
    OKR -.->|triggers event logging| AI
    REV -.->|campaign close → events, 1-on-1 draft| AI
```

The AI Automation group only **reads** from OKR and 360 Review (dashed arrows): database triggers log events into `domain_events`, AI results reside in dedicated tables within this group, and no OKR or 360 Review tables are modified by AI.

The dashed line between `review_assignments` and `review_answers` represents the core anonymity boundary: this association exists only while the campaign is actively collecting responses, and is detached when the campaign is closed (see [Anonymity, Audit Log, and AI Automation Constraints](#anonymity-audit-log-and-ai-automation-constraints)).

Thick arrows originating from the Organization group consolidate multiple foreign keys pointing to `app_users` (Objective owners, KR assignees, check-in users, reviewees, reviewers, notification recipients, etc.) to keep the overview readable; detailed relationships are shown in the ER diagrams below.

## Enums

| Enum | Values | UI Display |
|---|---|---|
| `user_role` | ADMIN, HR, MANAGER, EMPLOYEE | Administrator, HR, Manager, Employee |
| `cycle_status` | DRAFT, ACTIVE, CLOSED | Draft, Active, Closed |
| `okr_level` | COMPANY, DEPARTMENT, TEAM, INDIVIDUAL | Company, Department, Team, Individual |
| `org_unit_type` | DEPARTMENT, TEAM | Department, Team |
| `kr_type` | NUMBER, PERCENT, BOOLEAN | Number, Percentage, Boolean |
| `confidence_level` | ON_TRACK, AT_RISK, OFF_TRACK | On Track, At Risk, Off Track |
| `campaign_status` | DRAFT, NOMINATION, COLLECTING, CLOSED, PUBLISHED | Draft, Nomination, Collecting, Closed, Published |
| `reviewer_group` | SELF, MANAGER, PEER, DIRECT_REPORT | Self, Manager, Peer, Direct Report |
| `assignment_status` | NOT_STARTED, DRAFT, SUBMITTED, CANCELLED | Not Started, Draft, Submitted, Cancelled |
| `nomination_status` | DRAFT, PENDING, APPROVED | Draft, Pending, Approved |
| `result_grade` | EXCELLENT, GOOD, MEETS, NEEDS_IMPROVEMENT, INSUFFICIENT_DATA | Excellent, Good, Meets Expectations, Needs Improvement, Insufficient Data |
| `notification_type` | CHECKIN_REMINDER, CHECKIN_OFF_TRACK, CHECKIN_COMMENT, PLANNING_REMINDER, NOMINATION_REMINDER, NOMINATION_PENDING, REVIEW_REMINDER, RESULT_PUBLISHED, BLOCKER_ROUTED, BLOCKER_SUGGESTED, BLOCKER_UPDATED, WEEKLY_DIGEST, CHECKIN_MISMATCH, AI_DRAFT_READY, ONE_ON_ONE_SENT, AUTOMATION_ALERT | Check-in reminder, KR off track, New comment, OKR planning reminder, Nomination reminder, Pending nomination approval, Review form reminder, Results published, Blocker routed, Blocker send suggestion, Blocker acknowledged, Weekly digest, Check-in mismatch, AI draft ready for review, 1-on-1 summary received, Automation alert |
| `audit_action` | CREATE, UPDATE, SOFT_DELETE, RESTORE, STATUS_CHANGE, CHECKIN, SUBMIT, PUBLISH, LOGIN, LOGIN_FAILED, EXPORT | Create, Update, Delete (Soft Delete), Restore, Status Change, Check-in, Submit, Publish, Login, Login Failed, Export |
| `automation_flow` | BLOCKER_ROUTING, WEEKLY_DIGEST, ONE_ON_ONE_DRAFT, CHECKIN_MISMATCH, OKR_REVIEW, REVIEW_COMMENT_GUARD | Blocker routing, Weekly digest, 1-on-1 draft, Check-in mismatch, OKR review, Review comment guard |
| `trigger_kind` | EVENT, SCHEDULE, ON_SUBMIT | Event-based, Scheduled, On submit |
| `domain_event_type` | CHECKIN_CREATED, OBJECTIVE_CREATED, CAMPAIGN_CLOSED | New check-in created, New objective created, 360 campaign closed |
| `run_status` | PENDING, RUNNING, SUCCEEDED, FAILED, SKIPPED | Pending, Running, Succeeded, Failed, Skipped |
| `blocker_category` | DEPENDENCY, RESOURCE, TECHNICAL, PRIORITY_CHANGE, OTHER | Cross-department dependency, Resource constraint, Technical issue, Priority change, Other |
| `severity_level` | LOW, MEDIUM, HIGH | Low, Medium, High |
| `routing_status` | SUGGESTED, OPEN, ACKNOWLEDGED, REJECTED, DISMISSED | Suggested to the reporter, Open, Acknowledged, Rejected, Not sent |
| `review_issue` | NOT_MEASURABLE, OUTPUT_ONLY, DUPLICATE, NOT_ALIGNED | Difficult to measure, Output-only activity, Duplicate KR, Not aligned with parent |
| `draft_status` | PENDING_REVIEW, SENT, DISCARDED | Pending review, Sent, Discarded |

## Views

| View | Returns | Consumers / Usage |
|---|---|---|
| `vw_key_result_progress` | Progress 0–1 for each KR calculated as (current − initial) / (target − initial), clamped to 0–1; Boolean KR is 0 or 1 | Objective detail screen, dashboard |
| `vw_objective_tree` | Each Objective with root (`root_id`), depth (`depth`), and path from root (`path`), via recursive CTE | OKR tree, breadcrumb |
| `vw_campaign_reviewer_progress` | Remaining unsubmitted forms for each reviewer. **Contains no reviewee column** | HR campaign monitoring, reminders |
| `vw_automation_flow_status` | Per flow: enabled/disabled, quota, AI calls today, last run timestamp, 7-day error count, pending count | Automation screen (Admin, HR) |
| `vw_open_blockers` | Open blockers pending acknowledgment by target department head, with reporter and KR details | Routed blockers screen (Department head) |
| `vw_review_group_scores` | Average scores by campaign, reviewee, reviewer group, criterion; form count calculated via `response_key`. Populated only when campaign is CLOSED or PUBLISHED | **Business logic layer only.** Does not enforce the 3-review threshold, so API must not expose this view directly. |

## Detailed ER Diagram

Displays primary columns only. For full columns, data types, and default values, refer to the SQL or DBML file.

```mermaid
erDiagram
    departments ||--o{ departments : "parent unit"
    departments ||--o{ app_users : "employees"
    app_users ||--o{ app_users : "direct manager"
    app_users |o--o{ departments : "department head"

    okr_cycles ||--o{ objectives : "contains"
    objectives |o--o{ objectives : "parent objective"
    app_users ||--o{ objectives : "owns"
    departments |o--o{ objectives : "department / team OKRs"
    objectives ||--|{ key_results : "1–5 KRs"
    app_users ||--o{ key_results : "assignee"
    key_results ||--o{ checkins : "history"
    checkins ||--o{ checkin_comments : "comments"

    review_templates ||--|{ review_criteria : "criteria"
    review_templates ||--o{ review_questions : "open questions"
    okr_cycles ||--o| review_campaigns : "max 1 campaign"
    review_templates ||--o{ review_campaigns : "uses template"
    review_campaigns ||--o{ campaign_participants : "reviewees"
    review_campaigns ||--o{ nominations : "nominations"
    nominations ||--o{ nomination_peers : "peers"
    review_campaigns ||--o{ review_assignments : "assignments"
    review_assignments |o--o{ review_answers : "active collection only"
    review_criteria |o--o{ review_answers : "scores"
    review_questions |o--o{ review_answers : "feedback"

    okr_cycles ||--o{ final_results : "results"
    app_users ||--o{ final_results : "for user"
    app_users ||--o{ notifications : "receives"
    app_users |o--o{ audit_logs : "performed by"

    departments {
        bigint id PK
        varchar name
        bigint parent_id FK
        org_unit_type unit_type "department / team"
        bigint head_user_id FK "department head / team lead"
        boolean is_active
    }
    app_users {
        bigint id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        user_role role
        bigint department_id FK
        bigint manager_id FK
        boolean is_active
        int failed_login_count
        timestamptz locked_until
        timestamptz deleted_at
    }
    okr_cycles {
        bigint id PK
        varchar name
        date start_date
        date end_date
        cycle_status status
        smallint max_objectives_per_user
        numeric okr_weight
        timestamptz weight_locked_at
    }
    objectives {
        bigint id PK
        bigint cycle_id FK
        okr_level level
        varchar title
        bigint owner_user_id FK
        bigint department_id FK
        bigint parent_id FK
        numeric progress "cached"
        numeric final_progress "finalized on close"
        timestamptz deleted_at
    }
    key_results {
        bigint id PK
        bigint objective_id FK
        varchar title
        kr_type kr_type
        numeric start_value
        numeric target_value
        varchar unit
        bigint assignee_user_id FK
        numeric current_value "cached"
        confidence_level current_confidence "cached"
        timestamptz last_checkin_at
    }
    checkins {
        bigint id PK
        bigint key_result_id FK
        numeric value
        confidence_level confidence
        text note
        text blocker
        bigint created_by FK
        timestamptz created_at
    }
    checkin_comments {
        bigint id PK
        bigint checkin_id FK
        bigint author_user_id FK
        text body
    }
    review_templates {
        bigint id PK
        varchar name
        timestamptz deleted_at
    }
    review_criteria {
        bigint id PK
        bigint template_id FK
        varchar name
        text description
        smallint sort_order
    }
    review_questions {
        bigint id PK
        bigint template_id FK
        varchar question_text
        smallint sort_order
    }
    review_campaigns {
        bigint id PK
        bigint cycle_id FK,UK
        bigint template_id FK
        campaign_status status
        smallint min_peers
        smallint max_peers
        smallint anonymity_threshold
        date nomination_deadline
        date submit_deadline
    }
    campaign_participants {
        bigint campaign_id PK,FK
        bigint reviewee_user_id PK,FK
        bigint manager_user_id "snapshot"
        bigint department_id "snapshot"
    }
    nominations {
        bigint id PK
        bigint campaign_id FK
        bigint reviewee_user_id FK
        nomination_status status
        bigint approved_by FK
    }
    nomination_peers {
        bigint nomination_id PK,FK
        bigint peer_user_id PK,FK
    }
    review_assignments {
        bigint id PK
        bigint campaign_id FK
        bigint reviewee_user_id FK
        bigint reviewer_user_id FK
        reviewer_group reviewer_group
        assignment_status status
        timestamptz submitted_at
    }
    review_answers {
        bigint id PK
        bigint campaign_id FK
        bigint reviewee_user_id FK
        reviewer_group reviewer_group
        bigint assignment_id FK "NULL after close"
        uuid response_key "groups answers of 1 form"
        bigint criterion_id FK
        bigint question_id FK
        smallint score "1–5, NULL = N/A"
        text answer_text
    }
    final_results {
        bigint id PK
        bigint cycle_id FK
        bigint user_id FK
        numeric okr_progress
        numeric okr_score
        numeric review_score
        numeric final_score
        result_grade grade
        timestamptz published_at
    }
    notifications {
        bigint id PK
        bigint user_id FK
        notification_type type
        varchar body
        varchar link
        varchar dedupe_key
        timestamptz read_at
    }
    audit_logs {
        bigint id PK
        bigint actor_user_id FK
        audit_action action
        varchar module
        varchar entity_type
        bigint entity_id
        jsonb metadata
        inet ip_address
        timestamptz created_at
    }
```

## ER Diagram — AI Automation

Automation tables are separated to keep the primary diagram clear and readable. Tables `checkins`, `departments`, `objectives`, `app_users`, and `campaign_participants` show primary keys only to indicate join points.

```mermaid
erDiagram
    automation_flows ||--o{ automation_runs : "runs"
    automation_flows ||--o{ automation_daily_usage : "quota"
    domain_events |o--o{ automation_runs : "triggers"
    checkins ||--o| checkin_insights : "AI labels"
    departments |o--o{ checkin_insights : "routed to"
    automation_runs ||--o{ checkin_insights : "generated by"
    objectives ||--o{ objective_review_notes : "reviews"
    automation_runs ||--o{ objective_review_notes : "generated by"
    app_users ||--o{ weekly_digests : "receives"
    automation_runs ||--o{ weekly_digests : "generated by"
    campaign_participants ||--o| one_on_one_drafts : "1-on-1 draft"
    automation_runs ||--o{ one_on_one_drafts : "generated by"

    checkins {
        bigint id PK
    }
    departments {
        bigint id PK
    }
    objectives {
        bigint id PK
    }
    app_users {
        bigint id PK
    }
    campaign_participants {
        bigint campaign_id PK
        bigint reviewee_user_id PK
    }
    automation_flows {
        automation_flow flow PK
        varchar name
        trigger_kind trigger_kind
        varchar schedule_cron
        boolean is_enabled
        int daily_quota
    }
    domain_events {
        bigint id PK
        domain_event_type event_type
        bigint entity_id "ID only, no payload content"
        timestamptz processed_at
    }
    automation_runs {
        bigint id PK
        automation_flow flow FK
        bigint event_id FK
        varchar run_key "UNIQUE per flow"
        run_status status
        smallint attempt_count
        int input_tokens
        int output_tokens
        varchar error_message
    }
    automation_daily_usage {
        automation_flow flow PK,FK
        date usage_date PK
        int call_count
    }
    checkin_insights {
        bigint checkin_id PK,FK
        blocker_category blocker_category
        severity_level severity
        bigint target_department_id FK "suggested by AI"
        bigint routed_department_id FK "confirmed by the reporter"
        timestamptz confirmed_at
        boolean is_mismatch
        routing_status routing
        bigint handled_by FK
    }
    objective_review_notes {
        bigint id PK
        bigint objective_id FK
        bigint key_result_id FK
        review_issue issue
        varchar message
        timestamptz dismissed_at
    }
    weekly_digests {
        bigint id PK
        bigint manager_user_id FK
        date week_start
        jsonb stats "from database"
        jsonb highlights "AI generated, max 3"
    }
    one_on_one_drafts {
        bigint id PK
        bigint campaign_id FK
        bigint reviewee_user_id FK
        bigint reviewer_user_id FK "NULL = HR approval"
        jsonb ai_strengths "immutable"
        jsonb ai_improvements "immutable"
        text edited_text "approved version"
        draft_status status
    }
```

## Anonymity, Audit Log, and AI Automation Constraints

These are constraints that **every** query, API, and report must adhere to. Some are strictly enforced by the database; the remainder are the responsibility of the business logic layer.

| Rule | Database Enforced | Business Layer Responsibility |
|---|---|---|
| After campaign closure, no one (including Admins with database read privileges) can identify which reviewer submitted which score | `close_review_campaign()` sets `review_answers.assignment_id = NULL`; `review_assignments` contains no score column | Campaign closure must only execute via this function; manual state UPDATE operations are prohibited |
| Peer/Direct Report groups with fewer than 3 reviews cannot be displayed separately | `vw_review_group_scores` returns `form_count` based on `response_key` | Merge both groups if either has < 3; if the merged group is still < 3, hide completely and exclude from 360 review score calculation |
| During active response collection, HR can only view how many unsubmitted forms each reviewer has pending | `vw_campaign_reviewer_progress` contains no reviewee column | Campaign progress tracking APIs must query this view only |
| Audit logs must never compromise anonymity or sensitive secrets | `audit_logs` is append-only (cannot be updated or deleted) | `metadata` must not contain passwords, hashes, tokens, form response answers, or reviewer-reviewee mappings for anonymous groups |
| Check-in entries represent immutable history | `checkins` cannot be updated or deleted | Corrections must be submitted as a new check-in |
| AI never modifies business data | AI outputs are stored exclusively in dedicated automation tables; database triggers preserve original AI suggestions | The AI worker account has write permissions restricted solely to automation tables and `notifications` |
| Admins inspecting execution history cannot view payload content | `automation_runs` and `domain_events` contain no content or prompt columns | Application logs must never write AI prompts or generated response content |
| Review submission timestamps cannot be leaked via automation | The review comment guard flow is prohibited from inserting into `automation_runs` | Increments only `automation_daily_usage` |
| Real identities never leave the system | — | Pseudonymize user and department names to random identifiers before sending requests to AI; mapping tables reside exclusively in memory |
| Employees can only view approved content | `one_on_one_drafts`: can only be sent by the approver, and only after the campaign is published | The employee-facing API returns strictly `edited_text`, never exposing `ai_strengths` or `ai_improvements` |
