# Functional breakdown

> Design status: TARGET V1 — System functional breakdown

## Breakdown levels

The system is broken down into 4 levels, each more detailed than the one above. The example below is a 4-level OKR tree: company → department → team → individual. If a department is not divided into teams, individual OKRs link directly to the department OKR.

```text
[Company]    Improve product quality
               KR: Reduce customer-reported bugs from 50 to 20 bugs/month
               KR: Increase customer satisfaction score from 7.0 to 8.5
  └ [Dev Department]  Improve the testing process
                   KR: Increase test coverage from 40% to 70%
                   KR: 100% of pull requests reviewed before merge
      └ [Payments Team]  Stabilize the payments module
                             KR: Reduce production bugs from 12 to 3 bugs/month
          └ [Individual]  Write tests for the payments module
                         KR: Write 50 test cases
```

## F05 Check-in and progress

Update Key Result progress weekly; the system automatically calculates and rolls progress up to the higher levels.

- **F05.1 Key Result check-in**
- **F05.2 Automatic progress calculation and roll-up**
- F05.3 Check-in history and progress chart
- F05.4 Check-in feedback

Check-in: current value, confidence level (On track / At risk / Off track), notes, blockers, person who checked in, time. Each check-in is a new record; old records are kept unchanged as history.

Key Result progress is calculated by the formula (current − initial) / (target − initial), clamped between 0% and 100%.

## F06 360-degree review

Collect reviews from managers, peers, subordinates, and self-assessment; the peer and subordinate groups are anonymous.

- F06.1 Manage the criteria set (review form template)
- **F06.2 Create and open a review round**
- F06.3 Nominate peers
- F06.4 Approve reviewers
- **F06.5 Fill in the review form**
- F06.6 Track and close the round
- **F06.7 Individual 360 result**

Form template: list of criteria (name, description, required or not, scale 1–5) and open questions.

Review round: name, cycle, form template, reviewees, nomination deadline, submission deadline, status.

Review form: reviewee, reviewer group (Self / Manager / Peer / Subordinate), score per criterion (1–5 or "Not enough information"), open answers, status (Draft / Submitted).

360 result: score per criterion, score per reviewer group, gap between self-assessment and others, comments without names. Groups with fewer than 3 forms are not shown separately.

Sample criteria: Teamwork spirit · Communication · Proactive problem solving · Work quality · Support and knowledge sharing.

## F07 Final results

Combine the OKR score and the 360 score into one final score for each employee.

- F07.1 Finalize OKR score
- **F07.2 Aggregate OKR + 360 score**
- F07.3 Publish results

Final result: OKR progress, OKR score (scale 1–5), 360 score, final score, rating.

Example: OKR progress 83% → OKR score 4.32; 360 score is 4.20; final score = 0.6 × 4.32 + 0.4 × 4.20 = **4.27**, rating Good.

## F08 Dashboard

Overview page by role.

- F08.1 Personal dashboard: my OKR progress, Key Results needing check-in, review forms to fill in
- F08.2 Team dashboard: department OKR progress, members who have not checked in, at-risk OKRs
- F08.3 Company dashboard: progress by department, check-in rate, review completion rate

## F09 Reports

- F09.1 OKR progress report (by cycle, department, level)
- F09.2 Check-in rate report (by week, department, person)
- F09.3 Final results report
- F09.4 Export to Excel / PDF by the currently selected filters

## F10 Notifications and reminders

- F10.1 In-app notifications (bell, read / unread)
- F10.2 Email notifications
- F10.3 Automatic reminders

Reminder events: Key Result not checked in for 7 days, peers not nominated, review forms not yet submitted, results have been published.

## F11 Activity log

- F11.1 Record the log
- F11.2 View and filter the log

Log record: actor, action, module, object, time. The log does not contain review form content and does not record who reviewed whom in anonymous groups.

## F12 Personal profile

- F12.1 Update information (full name, phone number, avatar)
- F12.2 Change password
- F12.3 View my permissions

Email, role, department, and direct manager are view-only and cannot be edited by the user.

## F13 AI automation

The system automatically reads the **text** parts that ordinary rules cannot understand (notes, blockers, comments), then automatically routes work to the right person, summarizes, and raises alerts. Each flow runs on an event or on a schedule, with no one needing to press a button.

**Note**: AI only **reads, classifies, summarizes, alerts, and creates drafts**. AI does not score, does not rate, and does not modify OKR or 360 data.

- **F13.1 Route blockers to the right person**
- **F13.2 Weekly digest for managers**
- **F13.3 Draft 1-on-1 meeting after a 360 round**
- F13.4 Detect inconsistent check-ins
- F13.5 Review newly created OKRs
- F13.6 Warn about 360 comments that may reveal identity
- F13.7 Run history

| Flow  | When it runs              | What the AI does                                                                                                                 | What the system does automatically                                                 |
| ----- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| F13.1 | Check-in with a blocker   | Classify the blocker (dependency on another department, lack of resources, technical, priority change, other), related department, severity | Tag the check-in; notify the head of the related department if it is a dependency on another department |
| F13.2 | 8 AM on Monday            | Group similar blockers in the team's check-ins from last week, pick up to 3 items needing attention                              | Send the digest to the manager in the app and by email                             |
| F13.3 | HR closes the 360 round   | Summarize open comments from groups that meet the anonymity threshold into strengths and areas for improvement                   | Save a **draft** for the direct manager; the manager edits and sends it to the employee, or discards it |
| F13.4 | New check-in              | Compare the confidence level with the notes, e.g. "On track" selected but the note says "2 weeks late"                           | Prompt the person who checked in to review; if the contradiction occurs 3 times in a row, notify the direct manager |
| F13.5 | Save a new Objective      | Check whether the KRs are measurable, whether they duplicate KRs of people in the same department, whether they match the parent Objective | Attach a review note to the Objective for the creator and manager to see together |
| F13.6 | Click Submit 360 form     | Detect sentences that may reveal the writer or offensive wording                                                                 | Show a warning **only to the writer**; the writer edits or submits anyway          |

Configuration of each flow: on/off, run schedule (for scheduled flows), daily limit on the number of AI calls.

Run history: flow, trigger event, status (Pending / Succeeded / Failed / Skipped), number of attempts, run time, token count, error. The history does not store the content sent to the AI.

AI draft: type, recipient, content proposed by AI, content after the reviewer's edits, status (Pending approval / Sent / Discarded). All AI-generated content carries an "AI-generated" label in the UI.

Example: Lan checks in on KR "Increase test coverage" and notes the blocker "Waiting for the QA team to set up the test environment, already 1 week late". The AI classifies it: dependency on another department, QA department, high severity. The head of the QA department receives a notification with a link to Lan's KR.

## Out of scope for V1

Jira / GitLab / Slack integration, KPI / BSC / MBO methodologies, payroll calculation, single sign-on (SSO), a dedicated mobile app, AI that scores or rates employees, a chatbot that writes OKRs on behalf of users, a drag-and-drop automation flow builder. Details are in [01-scope.md](01-scope.md).

**Related:** [Scope](01-scope.md) · [Use cases](03-use-cases.md)
