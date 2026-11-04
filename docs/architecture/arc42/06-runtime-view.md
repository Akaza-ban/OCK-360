# 6. Runtime View — OKR360 V1

Every use case has a sequence diagram in the [sequence diagrams](../uml/sequence-diagrams.md), numbered like the use case (SD-12 is UC12). The scenarios below are the ones that matter most for the quality goals.

| Scenario | Why it matters | Diagram |
|---|---|---|
| Check-in and progress roll-up | Progress must update in the same transaction; AI must not slow it down | [SD-12](../uml/sequence-diagrams.md#sd-12--check-in-key-result) |
| One run of a background AI flow | Quota, deduplication, name masking, retry, schema validation | [SD-32](../uml/sequence-diagrams.md#sd-32--execute-ai-automation-flow) |
| Comment check when submitting a form | The only AI call a user waits for, at most 5 seconds | [SD-19](../uml/sequence-diagrams.md#sd-19--fill-review-form) |
| Closing a 360 round | Answers are separated from reviewers for good | [SD-20](../uml/sequence-diagrams.md#sd-20--monitor-review-progress-and-close-campaign) |
| Viewing 360 results | The anonymity threshold and access by reporting line | [SD-21](../uml/sequence-diagrams.md#sd-21--view-360-review-results) |
| Calculating and publishing final results | Scores follow the formulas; no AI is involved | [SD-22](../uml/sequence-diagrams.md#sd-22--aggregate-and-publish-final-results) |

Previous: [5. Building block view](05-building-block-view.md) · Next: [7. Deployment view](07-deployment-view.md)
