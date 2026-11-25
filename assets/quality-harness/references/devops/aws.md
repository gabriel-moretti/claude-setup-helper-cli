# Module: AWS

Applies when `infra.hosting = "aws"`. IaC: Terraform (default) or AWS CDK (TypeScript). Requires `terraform` (or CDK) and `github` modules.

## 1. Account structure
- **MUST** AWS Organizations + IAM Identity Center (SSO). No IAM users for people; no long-lived access keys anywhere.
- **MUST** separate accounts per environment: `prod`, `test`, `sandbox` (+ `shared-services`, `security`/`log-archive`). Control Tower or an equivalent landing zone.
- **MUST** PCI DSS workloads (CDE) in a dedicated account/OU with SCPs and isolated networking.
- **MUST** SCPs: deny leaving the org, deny disabling CloudTrail/GuardDuty/Config, restrict regions (default `sa-east-1`; `us-east-1` only for global services such as CloudFront/ACM/IAM).

## 2. Identity and access
- **MUST** GitHub → AWS via OIDC roles per repo and environment; trust policy scoped to `repo:ORG/REPO:environment:<env>`; PR plan role read-only.
- **MUST** least privilege: workload roles per service (ECS task role, Lambda execution role); no `*:*`; permission boundaries for roles created by pipelines.
- **SHOULD** IAM Access Analyzer findings reviewed monthly.

## 3. Compute (choose the simplest that fits)
| Need | Default |
|---|---|
| Event-driven, spiky, short tasks | Lambda |
| Containers, APIs, workers | ECS on Fargate |
| Static web / Next.js | CloudFront + S3, or containers on ECS/App Runner for SSR |
| Kubernetes | EKS only with a platform team and an ADR |
- **SHOULD** Graviton (arm64) by default; it's cheaper for the same performance in most workloads.

## 4. Network and data
- **MUST** workloads in private subnets; public only load balancers/CloudFront; security groups by reference, not CIDR `0.0.0.0/0` (except LB 443).
- **SHOULD** VPC endpoints (S3, ECR, Secrets Manager, CloudWatch) to cut NAT data cost.
- **MUST** RDS/Aurora PostgreSQL: Multi-AZ in prod, encryption, automated backups + PITR, deletion protection, IAM auth or Secrets Manager rotation, RDS Proxy for Lambda.
- **MUST** S3: Block Public Access at account level, SSE-KMS or SSE-S3, versioning on critical buckets, lifecycle rules.
- **MUST** secrets in Secrets Manager (rotating) or SSM Parameter Store (SecureString); never in env files, images or Terraform variables in plain text.

## 5. Security and observability
- **MUST** CloudTrail org trail to log-archive, GuardDuty, Security Hub (AWS FSBP + PCI DSS standards where relevant), AWS Config, Inspector for ECR/Lambda.
- **MUST** WAF on public CloudFront/ALB/API Gateway (managed rule groups + rate limit).
- **MUST** CloudWatch log groups with retention set (never "never expire"); structured JSON logs; alarms to an on-call channel.
- **SHOULD** OpenTelemetry/X-Ray tracing; dashboards per service.

## 6. Cost management (FinOps)
- **MUST** mandatory tags (`project`, `environment`, `criticality`, `owner`, `managed-by`) enforced by tag policies/default_tags and **activated as cost allocation tags**.
- **MUST** AWS Budgets per account and per project (actual + forecast alerts at 80/100/120%) and **Cost Anomaly Detection** monitors.
- **MUST** monthly cost review (asset `cost-review.yml` opens an issue with last month by service and the checklist below).
- **SHOULD** Savings Plans/Reserved after ~3 months of stable baseline; Compute Optimizer and Cost Optimization Hub recommendations reviewed monthly.
- **SHOULD** non-prod off-hours shutdown (Instance Scheduler or schedules on ECS desired count); gp3 over gp2; S3 Intelligent-Tiering for unknown access patterns; delete unattached EBS/EIPs/old snapshots.
- **SHOULD** Infracost on Terraform PRs to show the cost delta before merge (see terraform.md).
- Watch first: NAT Gateway data processing, cross-AZ traffic, CloudWatch Logs ingestion, idle RDS, oversized Fargate tasks.

## 7. AI tooling (agents)
Official MCP servers from [awslabs/mcp](https://github.com/awslabs/mcp) — fragment in `assets/modules/aws/mcp.json`:
| Server | Use |
|---|---|
| AWS Documentation | current docs, no credentials |
| AWS Pricing | price lookups and estimates before building |
| AWS Billing and Cost Management | cost/usage analysis, anomalies, budgets, optimization recommendations |
| AWS IaC | CloudFormation/CDK guidance and validation |
- **MUST** agents use a dedicated **read-only** profile (`ai-readonly`) with `assets/modules/aws/ai-readonly-cost-policy.json`; never credentials that can write to prod.
- **MUST** pin MCP server versions in place of `@latest` after review; changes to infra still go through Terraform PRs, never through agent API calls.

## Review checklist
- [ ] Resource tagged, in the right account, private by default
- [ ] Secrets in Secrets Manager/SSM; role least-privilege
- [ ] Logs retention + alarms; backups for stateful resources
- [ ] Cost delta known (Infracost or Pricing MCP) for new resources
