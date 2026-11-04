# 1. Introduction and Goals — OKR360 V1

## 1.1 Requirements overview

OKR360 is a web system for one company of about 50–300 employees. It replaces goal tracking and evaluation done in Excel and email:

- set goals with the OKR method and link them from company to department, team and individual;
- track progress with weekly check-ins that roll up automatically;
- run anonymous 360-degree reviews;
- combine OKR and 360 scores into end-of-period results;
- use AI to read free text (check-in notes, blockers, review comments), route work to the right person and prepare summaries, while people make every decision.

The problems, goals G1–G7 and their success measures are in the [scope](../../01-scope.md); the features are in the [feature breakdown](../../02-features.md); the use cases are in [Use Cases](../../03-use-cases.md).

## 1.2 Quality goals

The five qualities the architecture must protect first, in priority order. Each one is measured by the non-functional requirements listed.

| Priority | Quality goal | Meaning in OKR360 | Measured by |
|---|---|---|---|
| 1 | Anonymity | Nobody, not even Admin or HR, can find out who gave which 360 score | NFR-PRIV-001 to NFR-PRIV-006 |
| 2 | Correct figures | Progress, OKR score, 360 score and final score always follow the documented formulas; AI never changes them | BR-042 to BR-044, BR-071 to BR-074, BR-090 |
| 3 | AI never breaks the core | A slow or failing AI never blocks or corrupts a check-in, an Objective or a review form | NFR-REL-001, NFR-REL-004, NFR-PERF-006 |
| 4 | Security | Authorization is enforced in the backend by role, reporting line and ownership | NFR-SEC-001 to NFR-SEC-008 |
| 5 | Maintainability | One person can build and change the system: one codebase, clear layers, rules covered by tests | ADR-001, ADR-002, [implementation plan](../../09-implementation-plan.md) |

## 1.3 Stakeholders

| Stakeholder | Expectation from the architecture |
|---|---|
| Employee | Fast check-ins; review comments that stay anonymous |
| Manager | A clear view of the team; blockers and summaries prepared without reading every check-in |
| HR | Reliable 360 rounds and end-of-period results exportable in one action |
| Administrator | Control over organization data and over each AI flow, including its cost |
| Project owner (developer) | A design small enough to build alone, with every decision written down |

Previous: [arc42 index](README.md) · Next: [2. Architecture constraints](02-architecture-constraints.md)
