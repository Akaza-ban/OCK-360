# Glossary — OKR360

Terms used in the documents, the UI and the code. The **In code** column gives the corresponding table, enum or class name, so that reading the documents and reading the code use the same words.

## OKR and progress

| Term | Meaning | In code |
|---|---|---|
| OKR | Objectives and Key Results: set goals (Objective) and measure them with key results (Key Result) | — |
| Objective | A qualitative goal to achieve within the cycle | `objectives` |
| Key Result (KR) | A measurable result of an Objective; each Objective has 1–5 KRs | `key_results` |
| KR measurement type | Number (start → target, supports decreasing goals), Percent, Completion (0 or 1) | `kr_type`: `NUMBER`, `PERCENT`, `BOOLEAN` |
| OKR level | Company, department, team, individual | `okr_level` |
| Parent link | Connects an Objective to a parent Objective so progress contributes upward | `objectives.parent_id` |
| Skip-level link | Skipping a level when linking, e.g. an individual OKR linked straight to a department OKR that has no teams | — |
| OKR cycle | A shared working period, usually one quarter; moves one way Draft → Active → Closed | `okr_cycles`, `cycle_status` |
| Check-in | An update of a KR's current value, with confidence level, note and blocker; append-only, never edited | `checkins` |
| Confidence level | On track, At risk, Off track; an Objective's level is the worst level among its KRs | `confidence_level` |
| Blocker | Something obstructing a KR, written by the person checking in as free text | `checkins.blocker` |
| KR progress | (current − start) / (target − start), clamped to 0–100% | `vw_key_result_progress` |
| Progress roll-up | An Objective's progress is the average of its KRs and child Objectives, recalculated upward to the root | `ProgressRollup` |
| Expected progress | The fraction of the cycle's time that has elapsed, drawn as a marker on the progress bar | — |
| Soft delete | Hidden from the tree and reports but kept in the database for traceability | `deleted_at` |

## Organization and authorization

| Term | Meaning | In code |
|---|---|---|
| Unit | A department or team; a team sits directly under a department | `departments`, `org_unit_type` |
| Department head, team lead | The person in charge of a department or team, usually holding the Manager role | `departments.head_user_id` |
| Unit one manages | For a department head: the department and every team inside it; for a team lead: their own team | `AccessPolicy.managesUnit` |
| Direct manager | The person an employee reports to directly; not inferred from the unit tree | `app_users.manager_id` |
| Direct report | People whose direct manager is the user in question | `AccessPolicy.isDirectManager` |

## 360-degree review

| Term | Meaning | In code |
|---|---|---|
| 360-degree review | Evaluation from self-assessment, manager, peers and direct reports | — |
| 360 campaign | One review tied to a cycle; moves one way Draft → Nomination → Collecting forms → Closed → Published | `review_campaigns`, `campaign_status` |
| Form template | A set of 1–5 rated criteria and open questions shared across campaigns | `review_templates` |
| Reviewer group | Self, Manager, Peer, Direct report | `reviewer_group` |
| Nomination | The reviewee picks 3–5 colleagues to rate them | `nominations` |
| Form, assignment | The task of one person having to rate one person; contains no scores | `review_assignments` |
| Reporting-relationship snapshot | Each person's direct manager and unit recorded when form collection opens; all campaign calculations use this snapshot | `campaign_participants` |
| Separating answers from reviewers | When the campaign closes, the link between scores and forms is deleted, so no one can connect a score to a reviewer | `close_review_campaign()` |
| Anonymity threshold | The Peer or Direct report group is shown only when it has at least 3 forms | `anonymity_threshold` |
| Merged group | The Peer and Direct report groups are merged when one of them is below the threshold | `PEER_AND_REPORT` |

## Final results

| Term | Meaning | In code |
|---|---|---|
| OKR score | 1 + 4 × OKR progress, on a 1–5 scale | `ScoreCalculator.okrScore` |
| 360 score | Average of the displayed groups, excluding self-assessment | `ReviewResultService.overallScore` |
| Weight | The share of the OKR score in the final score, default 0.6; locked when form collection opens | `okr_cycles.okr_weight` |
| Final score | Weight × OKR score + (1 − weight) × 360 score | `final_results.final_score` |
| Grade | Excellent, Good, Satisfactory, Needs improvement, or Insufficient data | `result_grade` |
| Publish | Releases results to each employee; afterwards the results do not change | `publishFinalResults` |

## Automation and AI

| Term | Meaning | In code |
|---|---|---|
| Automatic | Work the system does itself by fixed rules, with no one pressing a button and no AI call | — |
| AI automated flow | One of 6 prebuilt flows that has a step calling the AI service | `automation_flows`, `automation_flow` |
| Scheduler | The part of the Worker that runs time-based jobs: weekly digest, reminders | `WorkerScheduler` |
| AI processor, Worker | A background process that receives events and runs AI flows; it is code, not an AI | `main.worker.ts`, `FlowRunner` |
| Event outbox | A table of events written by a trigger in the same transaction as the original operation, which the Worker reads later | `domain_events` |
| Run, `run_key` | One processing of a flow on one object; `run_key` prevents duplicate runs | `automation_runs` |
| Quota | Maximum number of AI calls per flow per day | `automation_flows.daily_quota` |
| AI Gateway | The only path to the AI service: replaces names with codes, calls, validates the schema | `AiGateway` |
| Replace names with codes | Replacing people's names with `NV-01` and units with `DV-01`, with a lookup list, before sending to the AI | `Masker` |
| JSON schema | The structure the AI's answer must follow; if it does not match, no action is taken | `OutputValidator` |
| AI-generated | A mandatory label on all AI-generated content | — |
| AI label | The result of classifying blockers and detecting mismatched check-ins | `checkin_insights` |
| Review note | AI suggestions on the quality of a newly created Objective | `objective_review_notes` |
| Weekly digest | Team metrics and up to 3 items needing attention, sent to the Manager at 8 AM on Monday | `weekly_digests` |
| 1-1 draft | A summary of 360 comments drafted by the AI, awaiting a person to review, edit and send | `one_on_one_drafts` |
| Comment warning | A warning shown only to the writer when a comment could reveal identity or is offensive; not stored | `REVIEW_COMMENT_GUARD` |

## Technical

| Term | Meaning | In code |
|---|---|---|
| JWT | Login token, expires after 30 minutes, sent via the `Authorization: Bearer` header | `TokenService` |
| Problem Details | The API's standard error format, with `errorCode` and `traceId` (lookup code) | `ProblemDetailsFilter` |
| `operationId` | The unique name of an operation in OpenAPI, identical to the controller function name | `openapi.yaml` |
| ADR | A record of an architecture decision with its reason and cost | `decisions.md` |

**Related:** [Use cases](../../03-use-cases.md) · [Business rules](../../requirements/business-rules.md) · [AI flow specification](ai-flows.md)
