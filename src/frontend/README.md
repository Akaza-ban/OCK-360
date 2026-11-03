# OKR360 — Frontend Prototype

A prototype user interface built with React + Vite, running entirely on **mock data** in `src/lib/data.js`. No backend or API calls yet. All changes (check-ins, form submissions, Objective creation) are stored only in browser memory and reset on page reload.

## Running the Demo

```bash
cd src/frontend
npm install
npm run dev
```

Open the printed Vite URL (usually `http://localhost:5173`). On the login page, click any demo account quick-switch button to sign in as that role, or enter an account email (e.g. `lan@okr360.vn`) with password `123456`.

| Account | Role | What to Explore |
|---|---|---|
| Nguyễn Thị Lan | Employee | My OKRs, check-in, fill 360 review form (check in with a blocker to see AI issue routing; write a review comment containing "the other day when I sat next to you" to trigger the AI de-anonymization warning), Q3 360 review results with manager summary |
| Trần Hoài Nam | Manager (Team Lead, Payments Team) | Team dashboard, check-in comments, reviewer approval, AI-generated **Weekly Digest** |
| Đinh Công Sơn | Manager (Head of Dev Department) | Team dashboard with department OKRs and 2 team OKRs; create team OKR in OKR Tree |
| Hoàng Thu Hà | Manager (Head of QA Department) | 360 results with grouped categories due to under 3 reviews, **Incoming Blockers** routed from Dev Department |
| Phạm Thu Mai | HR | 360 review campaigns, final evaluation results (select Q3/2026 cycle), **1-on-1 Drafts** awaiting approval |
| Lê Văn Hùng | System Administrator | Cycles, departments, audit logs, **Automation Flows** (toggle on/off, quotas, execution history); try accessing Final Results to see 403 Forbidden page |

The UI follows the Linear design style: dark mode by default, sun icon button at the bottom of the sidebar to switch to light mode (preference persisted in browser localStorage), and `Ctrl K` (or `⌘K` on Mac) command palette to jump directly to any page or Objective.

"Today" in the demo is pinned to October 30, 2026 (`TODAY` in `data.js`), so pace expectations and check-in reminders consistently render identically.

## Structure

```text
src/
├── main.jsx, App.jsx        # Entry point and hash-based routing (#/dashboard…)
├── index.css                # Dark/light theme styles, Inter font, shared components
├── components/              # Shell (sidebar, topbar, Ctrl K command palette), Login, AiWorker (background AI simulation), AiExplain ("What did AI do?" drawer), ui.jsx, icons.jsx
├── lib/
│   ├── data.js              # Mock data: 13-person sample company, 4 departments + 2 teams, 2 cycles, 2 review campaigns
│   ├── okr.js               # KR progress computation, parent Objective rollups, final scoring
│   ├── review.js            # 360 aggregation with anonymity threshold (3 reviews minimum)
│   ├── ai.js                # AI automation labels; simulated 360 comment warnings
│   ├── aiSim.js             # Simulated AI: anonymizes names to tokens, returns JSON, schema validation, weekly digest
│   ├── aiPipeline.js        # Execution steps for each AI run; used by AI worker and explanation drawer
│   ├── auth.js              # Mock session and UI-side permission rules
│   ├── store.jsx            # In-memory global state store (useReducer)
│   └── format.js            # Formatting helpers for numbers, dates, scores
├── features/
│   ├── dashboard/           # Personal, team, and company dashboards
│   ├── okr/                 # My OKRs, OKR tree, Objective details, check-in modal, Objective modal
│   ├── reviews/             # Pending forms, review filling, peer nomination, approval, 360 results
│   ├── results/             # Final results, reports
│   └── ai/                  # Incoming blockers, weekly digests, 1-on-1 drafts, automation flows
```
