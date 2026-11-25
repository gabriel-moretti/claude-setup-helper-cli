# Runbook: <ALERT_NAME>

| | |
|---|---|
| Service | `<service.name>` |
| Severity | SEV1 / SEV2 / SEV3 |
| Owner | @org/team |
| SLO affected | <slo name and target> |
| Dashboard | <link> |

## What it means
<One paragraph: what the alert measures and the user impact when it fires.>

## First 5 minutes
1. Check the dashboard: error rate, latency p95, saturation, recent deploys (release markers).
2. If a deploy happened in the last 30 min → roll back (link to rollback procedure).
3. Check dependencies: database, queue depth/age, acquirer/PSP status page.

## Diagnosis
- Logs query: `<query>`
- Traces: filter `service.name = <service> AND status = ERROR`
- Known causes and fixes:
  - <cause> → <fix>

## Escalation
<Who to call, when, and the communication channel for status updates.>

## After
Open a postmortem if SEV1/SEV2 (template: postmortem.md).
