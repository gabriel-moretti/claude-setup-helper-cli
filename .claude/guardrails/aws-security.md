---
domain: AWS — security
audience: AI coding agents (Claude Code, Cursor) writing IaC / provisioning AWS
context: Deltapag fintech. PCI-adjacent, LGPD. Least-privilege and no-public-by-default are non-negotiable.
priority_order: no-data-exposure > least-privilege > auditability > availability > convenience
---

# Guardrails — AWS Security

`MUST` = hard rule. `NEVER` = prohibited. `SHOULD` = default; deviating requires a one-line justification. `STOP` = halt and ask the human.

## Identity & access (least-privilege)

- MUST scope every IAM policy to specific actions and specific resource ARNs. NEVER write `Action: "*"` or `Resource: "*"` in a policy that touches data, secrets, or production. Wildcards are the default audit failure.
- MUST give each Lambda/service its own role with only the permissions it uses. NEVER share one broad role across functions.
- NEVER use long-lived IAM user access keys for workloads. Use roles (Lambda execution role, IRSA, instance profile, OIDC for CI). Human access goes through SSO/Identity Center with MFA.
- MUST deny by default; grant explicitly. SHOULD add permission boundaries / SCPs for blast-radius control.
- STOP before broadening any IAM permission, attaching `*Admin*`/`PowerUser`, or creating cross-account trust. Show exactly what it grants.

## Network exposure

- NEVER create a security group with `0.0.0.0/0` ingress except on an intentional public HTTPS entry point (ALB/CloudFront on 443), and only with justification. NEVER expose SSH/RDP/DB ports to the internet.
- MUST keep databases (RDS) and caches in private subnets, reachable only from app security groups. NEVER make a data store publicly accessible.
- MUST scope security-group ingress to source SGs/CIDRs, not "anywhere." Egress should be restricted where feasible.

## Data protection

- MUST enable encryption at rest on everything holding data: S3 (SSE-KMS), RDS, DynamoDB, EBS, SQS, secrets. NEVER store cardholder/PII data unencrypted.
- MUST enforce TLS in transit; deny non-TLS access (e.g. S3 bucket policy `aws:SecureTransport=false` deny). NEVER allow plaintext data paths.
- MUST block all public access on S3 buckets by default (account-level Block Public Access on). A public bucket is an explicit, reviewed, justified exception. STOP before making any bucket/object public.
- SHOULD use customer-managed KMS keys with rotation for sensitive data; restrict key policies.

## Secrets

- MUST store secrets in Secrets Manager / SSM SecureString / Supabase Vault, fetched at runtime via role. NEVER put secrets in env vars committed to IaC, in plaintext SSM, in code, or in logs.
- SHOULD enable secret rotation where supported. NEVER reuse one secret across environments.

## Auditability & detection

- MUST keep CloudTrail enabled (all regions) and protect the trail. NEVER disable logging to "reduce noise/cost."
- SHOULD enable GuardDuty, Config rules, and Security Hub baseline; alert on root usage, IAM policy changes, public-exposure changes, and failed-auth spikes.
- MUST log access to sensitive resources; protect logs from tampering (separate account/bucket, object-lock for audit logs where feasible).

## Operational safety

- MUST require MFA for human console/CLI access; NEVER use the root account for daily work — lock it with MFA and alarms.
- SHOULD separate environments by account (prod isolated from dev). NEVER let dev credentials reach prod.

## STOP-and-ask triggers

Halt and present exact impact before: widening an IAM grant or using a wildcard, opening a security group to the internet, making an S3 bucket/object public, disabling encryption or a log trail, creating cross-account trust, or touching root/SSO config.
