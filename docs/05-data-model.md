# 05. Data Model — OKR360

This document explains **why** the database is designed the way it is. The diagram is in [DATABASE.md](DATABASE.md). The SQL schema is written in increment I1 of the [implementation plan](09-implementation-plan.md), following both documents.

## 1. Table list

| Group               | Table                                                     | Purpose                                                                                                         |
| ------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Organization        | `departments`                                             | Unit tree: departments and teams (`unit_type`), with a responsible person who is the department head or team lead (`head_user_id`) |
|                     | `app_users`                                               | Accounts, roles, department, direct manager, login lockout after repeated failures                              |
| OKR                 | `okr_cycles`                                              | Quarterly cycles, status, maximum Objectives per person, OKR/360 weighting                                      |
| Objective           | `objectives`                                              | 4-level Objectives (company, department, team, individual), linked to the parent Objective by `parent_id`       |
|                     | `key_results`                                             | 1–5 KRs per Objective, with type, initial value, target value, owner                                            |
|                     | `checkins`                                                | Each KR update: new value, confidence level, notes, blockers                                                    |
|                     | `checkin_comments`                                        | Direct manager comments on a check-in                                                                           |
| 360 review          | `review_templates`, `review_criteria`, `review_questions` | Form template: criteria scored 1–5 and open questions                                                           |
|                     | `review_campaigns`                                        | A review round tied to a cycle, with anonymity threshold and minimum/maximum number of peers                    |
|                     | `campaign_participants`                                   | Reviewees, with a snapshot of manager and department when form collection opens                                 |
|                     | `nominations`, `nomination_peers`                         | The list of peers each person nominates and the approval status                                                 |
|                     | `review_assignments`                                      | Who must review whom, in which group, and whether submitted. Contains no scores                                 |
|                     | `review_answers`                                          | Scores and comments of each form                                                                                |
| Results and system  | `final_results`                                           | OKR score, 360 score, final score, and rating of each person per cycle                                          |
|                     | `notifications`                                           | In-app and email notifications                                                                                  |
|                     | `audit_logs`                                              | Operation log, insert-only                                                                                      |
| AI automation       | `automation_flows`                                        | Configuration of the 6 prebuilt flows: on/off, run schedule, daily AI call limit                                |
|                     | `domain_events`                                           | Event outbox: triggers write when there is a check-in, new Objective, or 360 round closed                       |
|                     | `automation_runs`                                         | Run history of each flow: status, number of attempts, tokens, errors. No content                                |
|                     | `automation_daily_usage`                                  | Number of AI calls per flow per day, used to apply the limit                                                    |
|                     | `checkin_insights`                                        | AI labels on check-ins and the handling status of routed blockers                                               |
|                     | `objective_review_notes`                                  | Review notes for newly created OKRs                                                                             |
|                     | `weekly_digests`                                          | Weekly digest for managers                                                                                      |
|                     | `one_on_one_drafts`                                       | Draft 1-on-1 summaries after a 360 round, awaiting reviewer approval                                            |

General conventions:

- All tables are in the `okr360` schema. Primary keys are `BIGINT GENERATED ALWAYS AS IDENTITY`.
- Times use `TIMESTAMPTZ`; cycle dates and deadlines use `DATE`.
- KR values use `NUMERIC(14,4)` to avoid rounding errors when dividing; progress is stored as 0–1 (`NUMERIC(5,4)`), and the UI multiplies by 100 for display.
- Statuses use PostgreSQL enums instead of free-form strings, so the database rejects unknown values.

## 2. Design decisions

### 2.0 Organization tree: departments and teams in one table

Software companies often divide departments into teams, for example the Dev Department has the Payments Team and the Platform Team. Instead of adding a separate `teams` table, `departments` is a **unit tree** with a `unit_type` column:

```text
Board of Directors (root, represents the company)
├── Dev Department        DEPARTMENT · head: Sơn
│   ├── Payments Team     TEAM · team lead: Nam
│   └── Platform Team     TEAM · team lead: Huy
├── QA Department         DEPARTMENT · not divided into teams
└── Sales Department      DEPARTMENT · not divided into teams
```

| Rule                                                                         | Enforced by                      |
| ---------------------------------------------------------------------------- | -------------------------------- |
| A team must have a parent department                                         | `ck_departments_team_has_parent` |
| A team has no child units (the org tree has at most 4 levels, matching the 4 OKR levels) | Trigger `check_org_unit_type`    |
| No cycles in the tree                                                        | Trigger `check_department_cycle` |

With a single shared table, `app_users.department_id`, `objectives.department_id`, the snapshot `campaign_participants.department_id`, and `checkin_insights.target_department_id` can all point to a department **or** a team without extra columns. An employee in a team has the team as `department_id`; in a department not divided into teams, the employee belongs directly to the department.

Reporting relationships still follow `manager_id` and are not derived from the unit tree: typically the team lead is the direct manager of team members, and the department head is the direct manager of the team leads.

### 2.1 OKR tree: adjacency list + recursive CTE

Each Objective stores only `parent_id`. This is simple when adding, editing, or moving an Objective to a different parent; to read the whole tree, use the view `vw_objective_tree` (recursive CTE), which returns the root, depth, and path.

The tree is at most 4 levels deep (company → department → team → individual), so the recursive CTE is not expensive. More complex structures such as nested sets or closure tables are not needed.

Trigger `check_objective_rules` ensures:

| Rule                                                                                                   | Example blocked                                                               |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| The parent must be in the same cycle                                                                   | A Q4 Objective linked to a Q3 Objective                                       |
| Valid levels: Department → Company; Team → Department or Company; Individual → Team, Department, or Company | A Department Objective linked to an Individual Objective; a team OKR linked to another team OKR |
| A department OKR is linked to a unit of type department; a team OKR is linked to a unit of type team   | A team OKR linked to the QA Department                                        |
| An Objective that still has child Objectives cannot be deleted                                         | Deleting the O "Increase revenue" while the Sales department is aligned to it |
| A closed cycle is read-only                                                                            | Editing the title of a Q3 Objective after Q3 is closed                        |

**Level skipping** is allowed: a department not divided into teams has individual Objectives linked directly to the department Objective (Minh in the QA Department), and a newly formed team can link directly to a company Objective.

Because levels only go downward, the OKR tree **cannot have cycles**; the trigger still checks for cycles as a precaution.

### 2.2 Progress: where it is calculated, where it is stored

| Value                                                                | How it is obtained                                                                     | Reason                                                                                                                                       |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `key_results.current_value`, `current_confidence`, `last_checkin_at` | Trigger `apply_checkin_to_key_result` updates on each check-in insert                  | The list screen does not have to read the `checkins` table                                                                                   |
| KR progress                                                          | View `vw_key_result_progress`: `(current − initial) / (target − initial)`, clamped to 0–1 | The formula is correct even when the goal is to decrease (for example reducing bugs from 40 to 10)                                        |
| `objectives.progress`                                                | The business layer recalculates and stores it **in the same transaction** as the check-in | Objective progress is the average of its KRs **and** child Objectives, propagating up to the root. If calculated on every read, the company dashboard would have to traverse the whole tree |
| `objectives.final_progress`                                          | Finalized once when the cycle is closed                                                | Final results do not change even if the formula is modified later                                                                            |

The roll-up formula is kept identical to `src/frontend/src/lib/okr.js`, so the database and the UI produce the same numbers.

### 2.3 Check-ins and logs are immutable

`checkins` and `audit_logs` have a `forbid_mutation` trigger that blocks every UPDATE and DELETE. If a check-in is entered incorrectly, a new check-in is created. This way the progress-over-time chart is always the true history, and no one can "adjust numbers to look nicer".

Trigger `check_checkin_insert` also blocks:

- check-ins when the cycle is not in ACTIVE status;
- check-ins on behalf of someone who does not own the KR;
- Yes/No KRs receiving a value other than 0 or 1.

### 2.4 Soft delete

| Table                       | Deletion method            | Reason                                                            |
| --------------------------- | -------------------------- | ----------------------------------------------------------------- |
| `app_users`                 | `deleted_at`, `is_active`  | People who leave must remain in OKR history, check-ins, and results |
| `objectives`, `key_results` | `deleted_at`, `deleted_by` | Allows restoration; old check-ins still point back to the KR      |
| `review_templates`          | `deleted_at`               | Old rounds can still read the criteria that were used             |
| `departments`               | `is_active`                | A dissolved department still appears in reports of past periods   |

Email only needs to be unique among non-deleted accounts (`uq_app_users_email_active` is a partial unique index), so a person who returns to work can reuse their old email.

### 2.5 Statuses only move forward

| Object | Flow                                                 | Trigger                                                                           |
| ------ | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| Cycle  | DRAFT → ACTIVE → CLOSED                              | `check_cycle_transition`; a partial unique index ensures only one ACTIVE cycle    |
| 360 round | DRAFT → NOMINATION → COLLECTING → CLOSED → PUBLISHED | `check_campaign_transition`; only one step at a time                           |

When a 360 round moves to COLLECTING, the trigger locks the cycle's OKR/360 weighting (`weight_locked_at`). Once people have started to be scored under one formula, no one can change the formula midway.

### 2.6 Reporting relationship snapshot

The reviewer's group (Manager, Peer, Subordinate) depends on who is whose manager. If a person changes department in the middle of a round, the result would be grouped incorrectly.

Therefore, when form collection opens, the system records `campaign_participants.manager_user_id` and `department_id`. All calculations for the round use this snapshot, not the current `app_users.manager_id`.

## 3. 360 anonymity design

This is the hardest part of the schema. Requirement: the reviewee, the manager, and even HR must not know which peer or subordinate gave which score.

### 3.1 Separate "who must review" from "what score"

| Table                | Knows                                      | Does not know              |
| -------------------- | ------------------------------------------ | -------------------------- |
| `review_assignments` | A must review B, which group, submitted or not | Scores                 |
| `review_answers`     | Which group's form, for whom, what score   | Who reviewed (after the round is closed) |

While forms are being collected, `review_answers.assignment_id` still points back to the assignment, so reviewers can save drafts and edit their own forms. When the round is closed, the function `close_review_campaign()` does the following in one transaction:

1. Set the round to CLOSED.
2. Delete the answers of unsubmitted forms.
3. Set unsubmitted assignments to CANCELLED.
4. Set `assignment_id = NULL` for every answer in the round.

After step 4, even someone with read access to the entire database cannot link a score to a reviewer. Answers belonging to the same form are still grouped by `response_key` (a random UUID), so forms can be counted accurately.

### 3.2 The 3-form threshold

`vw_review_group_scores` returns the average score and number of forms per group, but does **not** apply the threshold. The business layer applies the rule as in `src/frontend/src/lib/review.js`:

1. If the Peer or Subordinate group has fewer than 3 forms, the two groups are merged.
2. If after merging there are still fewer than 3 forms, the group is hidden and not counted in the 360 score.
3. The 360 score is the average of the displayed groups, excluding self-assessment.

The API never returns this view directly. The progress view for HR (`vw_campaign_reviewer_progress`) only has the reviewer and the number of remaining forms, not the reviewee.

## 4. Transaction boundaries

| Operation             | What is included in the same transaction                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Check-in              | Insert `checkins` → trigger updates the KR → recalculate `progress` of the Objective and all parent Objectives → insert `notifications` if the KR is off track → write `audit_logs`                                                                         |
| Submit a 360 form     | Save `review_answers` → `review_assignments.status = SUBMITTED` → write `audit_logs` (without scores)                                                                                                                                                        |
| Approve nominations   | `nominations.status = APPROVED` → create Peer-group `review_assignments`                                                                                                                                                                                     |
| Open form collection  | Change round status → write `campaign_participants` (snapshot) → create Self, Manager, and Subordinate assignments → trigger locks the weighting                                                                                                              |
| Close a 360 round     | `SELECT close_review_campaign(id)`                                                                                                                                                                                                                           |
| Close a cycle         | Finalize `final_progress` → `okr_cycles.status = CLOSED`                                                                                                                                                                                                     |
| Aggregate results     | Runs only when both the cycle and the 360 round are CLOSED → calculate and overwrite `final_results` for everyone; rejected if the round is already PUBLISHED                                                                                                |
| Publish results       | Round to PUBLISHED → `final_results.published_at` → `RESULT_PUBLISHED` notification                                                                                                                                                                          |
| One AI flow run       | Fetch unprocessed events (`FOR UPDATE SKIP LOCKED`) → create `automation_runs` (skip on duplicate `run_key`) → **call the AI outside the transaction** → open a new transaction: write labels/notes/digests/drafts + `notifications` + update the run + the event's `processed_at` |
| Send a 1-on-1 draft   | `one_on_one_drafts.status = SENT` → `ONE_ON_ONE_SENT` notification → write `audit_logs` (without content)                                                                                                                                                    |

## 5. Final score

`final_results` stores results in advance and does not recalculate on every view:

- OKR score = 1 + 4 × individual OKR progress (scale 1–5).
- Final score = `okr_weight` × OKR score + (1 − `okr_weight`) × 360 score. Defaults are 0.6 and 0.4.
- Rating: from 4.5 Excellent; from 3.5 Good; from 2.5 Satisfactory; below 2.5 Needs improvement.
- If the OKR or 360 score is missing, `final_score = NULL` and `grade = INSUFFICIENT_DATA`. The constraint `ck_final_results_missing` forces these two columns to always go together, so no one is rated with a score of 0.

## 6. Notifications and logs

**Preventing duplicate sends.** Reminder jobs may re-run on failure. `notifications` has `UNIQUE (user_id, dedupe_key)`, with `dedupe_key` = event type + object + date (for example `checkin_reminder:kr:12:2026-10-30`). Jobs use `INSERT … ON CONFLICT DO NOTHING`, so each person receives at most one reminder per event per day.

**Safe logs.** `audit_logs.metadata` is JSONB so each module can record its own information, but it **never** contains:

- passwords, password hashes, tokens;
- scores or comments in 360 forms;
- reviewer–reviewee pairs of the Peer or Subordinate group.

Submitting a form records only "user X submitted a form in round Y".

## 7. AI automation

### 7.1 Event outbox

Check-in, Objective creation, and 360 round closing do not call the AI. A trigger only writes one row into `domain_events` **in the same transaction** as the original operation:

| Event               | Written when                                 | Flows that use it                                       |
| ------------------- | -------------------------------------------- | ------------------------------------------------------- |
| `CHECKIN_CREATED`   | Insert into `checkins`                       | Route blockers, detect inconsistent check-ins           |
| `OBJECTIVE_CREATED` | Insert into `objectives`                     | Review newly created OKRs                               |
| `CAMPAIGN_CLOSED`   | `review_campaigns.status` changes to CLOSED  | 1-on-1 draft                                            |

If a check-in fails and is rolled back, the event disappears too; if the check-in is saved, the event is guaranteed to exist. The AI worker reads events afterwards, so a slow or broken AI does not make the check-in slow or broken.

`domain_events` has only the event type and the object id and **does not copy the content** of notes or comments. The worker reads content from the source table when processing, so if the object has been soft-deleted there is nothing left to send.

The **Weekly digest** flow needs no event: the Scheduler creates a run at 8 AM on Monday. The **360 comment warning** flow runs immediately when a form is submitted, without going through the outbox (see 7.4).

### 7.2 Preventing duplicate runs and retrying

- `automation_runs` has `UNIQUE (flow, run_key)`. `run_key` is the object the flow processes: `checkin:21`, `objective:9`, `user:3:week:2026-10-26`, `campaign:1:reviewee:4`. If a job re-runs or two workers pick up the same event, the second attempt is rejected by the database.
- AI service error → `attempt_count` increases, `next_attempt_at` is set to after 1, 5, 15 minutes. After more than 4 attempts → `FAILED` with `error_message` (a constraint requires an error).
- A flow that is turned off or exceeds `daily_quota` → `SKIPPED`, no AI call.

### 7.3 AI writes only to its own area

No OKR or 360 table has a column written by AI. AI results live in 4 separate tables, each with a trigger that preserves the original AI proposal:

| Table                    | What the person may edit                                                                                                    | What the database blocks                                                                                                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkin_insights`       | The head of the unit the blocker is routed to (department head or team lead): `routing`, `handled_by`, `handled_at`, `handler_note` | Editing AI labels already written; someone other than the responsible person handling it; changing status after it has been handled; routing a blocker back to the check-in author's own unit or to the department containing their team |
| `objective_review_notes` | The Objective creator: `dismissed_at`                                                                                       | —                                                                                                                                                                                                                   |
| `weekly_digests`         | The manager: `read_at`                                                                                                      | Two digests in the same week; more than 3 items                                                                                                                                                                     |
| `one_on_one_drafts`      | The reviewer: `edited_text`, `status`                                                                                       | Editing `ai_strengths`/`ai_improvements`; creating a draft while the round is not closed; a reviewer different from the manager in the snapshot; sending when the round is not published; someone other than the reviewer sending; editing after it has been sent |

Employees only see the `edited_text` of a 1-on-1 draft, never the original AI proposal.

### 7.4 No data leakage through automation

- `automation_runs` has only technical figures (status, time, tokens, errors). It has no column containing the content sent to the AI or returned by the AI, so an Admin viewing the run history cannot read check-in notes or 360 comments.
- The **360 comment warning** flow never has a row in `automation_runs` (a trigger blocks it); it only increments `automation_daily_usage`. If every form submission had a history row, the timestamp of that row would coincide with when a form was submitted and could be used to guess who reviewed.
- Replacing person names with codes (`NV-01`) and sending units as codes with a directory (`DV-01`) before sending to the AI is the business layer's job; the code mapping table lives only in the memory of the run and is not saved to the database.
- 1-on-1 drafts use only comments from groups that meet the anonymity threshold, taken from `review_answers` after the round is CLOSED (at which point answers are already detached from reviewers).

## 8. Schema tests to write

The SQL schema is written in increment I1 together with tests that run against a real PostgreSQL inside a transaction that rolls back. Every "blocked" test must also match the error message, so that it is blocked precisely because of that rule.

| Group | What to test |
|---|---|
| Figures | KR and Objective progress, roll-up through the 4-level OKR tree, 360 score per group, final score and grade |
| Anonymity | After a round is closed, no answer has an `assignment_id` |
| Blocked rules | Two ACTIVE cycles; Objective at the wrong level; team OKR linked to another team OKR; team with child units; a 6th KR; check-in by someone other than the KR owner or in a closed cycle; editing a check-in or an audit log |
| AI automation | A check-in writes exactly one event; duplicate runs are rejected; the comment check never writes run history; AI result tables keep the original AI suggestion |
