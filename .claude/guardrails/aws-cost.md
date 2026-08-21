---
domain: AWS — cost
audience: AI coding agents (Claude Code, Cursor) writing IaC / provisioning AWS
context: Deltapag — ~20-person fintech. Cost surprises hurt; prefer serverless, pay-per-use, small blast radius.
priority_order: don't-provision-surprises > observable-spend > right-sizing > convenience
---

# Guardrails — AWS Cost

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human before provisioning.

## Provisioning discipline

- STOP before creating any resource with a standing hourly/monthly cost (NAT Gateway, RDS instance, ElastiCache, OpenSearch, provisioned Kinesis, ALB/NLB, EC2, Global Accelerator, VPC endpoints at scale). Present the estimated monthly cost and a cheaper alternative first. NEVER provision these silently.
- MUST prefer pay-per-use/serverless defaults: Lambda, SQS, DynamoDB on-demand, S3, EventBridge — over always-on infrastructure, unless there's a measured reason.
- NEVER provision a NAT Gateway when a VPC endpoint (S3/DynamoDB gateway endpoints are free) or a public-subnet Lambda design removes the need. NAT is a classic silent monthly bill.
- MUST express all infrastructure as code (Terraform/CDK/SAM). NEVER click-create production resources by hand — untracked resources are untracked cost.

## Tagging & accountability

- MUST tag every resource with at least `project`, `env`, `owner`, `cost-center`/company (deltapag / aki-mais / alquimeat / zoov). Untagged spend is un-attributable. NEVER create a resource without these tags.
- SHOULD enforce tagging via IaC defaults / module wrappers so it can't be forgotten.

## Right-sizing & limits

- MUST set Lambda memory deliberately and add a sane `timeout` (not the 15-min max by default). Right-size after measuring.
- MUST set DynamoDB to on-demand unless a steady, predictable load justifies provisioned + auto-scaling. NEVER over-provision throughput "to be safe."
- MUST set log retention on every CloudWatch log group (e.g. 30–90 days). NEVER leave retention at "never expire" — unbounded log storage is a slow, silent bill.
- SHOULD set S3 lifecycle rules (transition to IA/Glacier, expire) for logs, exports, and reconciliation artifacts.

## Guardrails for the bill itself

- SHOULD provision AWS Budgets with alerts (e.g. 50/80/100% of monthly target) per account/project, and a Cost Anomaly Detection monitor.
- MUST avoid creating resources that scale cost with traffic without a cap: set Lambda reserved/max concurrency where a runaway loop could fan out, and SQS/consumer limits. Protect against a retry storm becoming a cost storm.
- SHOULD prefer a single shared NAT/endpoint strategy over per-service duplication.

## Data transfer (the hidden cost)

- MUST keep chatty services in the same region/AZ where practical; cross-AZ and cross-region transfer and egress are billed. NEVER design a hot path that egresses through NAT or cross-region without flagging it.
- SHOULD use gateway VPC endpoints (free) for S3/DynamoDB access from private subnets.

## STOP-and-ask triggers

Halt and present cost estimate + alternative before: any always-on resource, raising a concurrency/throughput ceiling, a design that adds NAT/egress to a hot path, or anything whose cost scales with traffic uncapped.
