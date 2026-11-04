# 10. Quality Requirements — OKR360 V1

The full list of 39 measurable quality requirements, with how each is verified, is in the [non-functional requirements](../../requirements/non-functional-requirements.md). This section shows how they group under the quality goals of [section 1](01-introduction-and-goals.md#12-quality-goals) and gives one concrete scenario per goal.

## 10.1 Quality tree

| Quality goal | Requirements |
|---|---|
| Anonymity | NFR-PRIV-001 to NFR-PRIV-006 |
| Correct figures | Business rules BR-042 to BR-044, BR-071 to BR-074; unit tests of `ScoreCalculator` and `ProgressRollup` |
| AI never breaks the core | NFR-REL-001 to NFR-REL-004, NFR-PERF-006, NFR-AI-001 to NFR-AI-006 |
| Security | NFR-SEC-001 to NFR-SEC-008 |
| Performance | NFR-PERF-001 to NFR-PERF-005 |
| Usability and accessibility | NFR-UX-001 to NFR-UX-005 |
| Operability | NFR-OPS-001 to NFR-OPS-003, NFR-REL-005 |

## 10.2 Quality scenarios

| Goal | Scenario | Expected response |
|---|---|---|
| Anonymity | Someone with read access to the whole database looks for who gave a score in a closed round | No column links the score to a reviewer (NFR-PRIV-001) |
| Correct figures | An employee checks in 25 of 50 test cases | The KR shows 50% and every parent Objective is recalculated in the same save |
| AI never breaks the core | The AI service is down while 20 people check in | All check-ins are saved immediately; the runs retry after 1, 5 and 15 minutes, then are marked Failed |
| Security | An employee calls the API to read a colleague's 360 result | `403`, whatever the UI shows |
| Performance | 60 concurrent users open the company OKR tree | P95 at most 1 second (NFR-PERF-003) |

Previous: [9. Architecture decisions](09-architecture-decisions.md) · Next: [11. Risks and technical debt](11-risks-and-technical-debt.md)
