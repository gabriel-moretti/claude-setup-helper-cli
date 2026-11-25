# Module: Azure

Applies when `infra.hosting = "azure"`. IaC: Terraform (`azurerm`/`azapi`). Requires `terraform` and `github` modules.

## 1. Organization
- **MUST** management groups → subscriptions per environment (`prod`, `test`, `sandbox`) following the Cloud Adoption Framework landing zone; PCI workloads in a dedicated subscription.
- **MUST** Azure Policy at management-group level: allowed locations (default `brazilsouth`; paired/secondary region by ADR), required tags, deny public IPs on VMs, require HTTPS/TLS 1.2+, diagnostic settings deployed.
- **MUST** resource groups by workload + environment; naming convention `<type>-<project>-<env>-<region>-<nn>`.

## 2. Identity
- **MUST** Microsoft Entra ID for people; PIM (just-in-time) for Owner/Contributor on prod; MFA via Conditional Access.
- **MUST** managed identities for workloads; no client secrets in apps.
- **MUST** GitHub → Azure via workload identity federation (OIDC) per repo/environment; PR plan identity has Reader only.
- **MUST** RBAC least privilege at resource-group scope; avoid subscription-level Contributor for apps.

## 3. Compute
| Need | Default |
|---|---|
| Containers, APIs, workers | Azure Container Apps |
| Simple web apps | App Service (Linux) |
| Event-driven | Azure Functions (Flex Consumption / Premium for VNet) |
| Kubernetes | AKS only with a platform team and an ADR |

## 4. Network and data
- **MUST** Private Endpoints for PaaS data services (PostgreSQL, Storage, Key Vault); public network access disabled.
- **MUST** Azure Database for PostgreSQL Flexible Server: zone-redundant HA in prod, backups with geo-redundancy for critical data, Entra auth.
- **MUST** Key Vault in RBAC mode, soft delete + purge protection; secrets/certs referenced, never copied into app settings.
- **MUST** Storage: no anonymous blob access, TLS 1.2+, versioning/soft delete for critical containers.
- **MUST** Front Door or Application Gateway with WAF for public endpoints.

## 5. Security and observability
- **MUST** Defender for Cloud enabled (CSPM + plans for used services); Regulatory compliance dashboard with PCI DSS where relevant.
- **MUST** diagnostic settings to Log Analytics; Application Insights (OpenTelemetry) per app; retention set per table; alerts to on-call.

## 6. Cost management
- **MUST** budgets per subscription and per resource group with actual/forecast alerts; cost allocation by tags.
- **SHOULD** Azure Advisor cost recommendations reviewed monthly; Savings Plan/Reservations after stable baseline; auto-shutdown/scale-to-zero for non-prod (Container Apps min replicas 0).
- Watch first: Log Analytics ingestion (use Basic logs/commitment tiers), idle App Service plans, overprovisioned PostgreSQL, egress, Private Endpoint count.
- **SHOULD** Infracost on Terraform PRs.

## 7. AI tooling (agents)
- **Azure MCP Server** (official, [microsoft/mcp](https://github.com/microsoft/mcp), npm `@azure/mcp`) and **Microsoft Learn MCP** (docs) — fragment in `assets/modules/azure/mcp.json`.
- **MUST** agent identity limited to **Reader** + **Cost Management Reader** on the target scope; never write access to prod; changes only through Terraform PRs. Pin versions after review.

## Review checklist
- [ ] Policy-compliant location, tags, naming
- [ ] Managed identity + Key Vault references; no secrets in settings
- [ ] Private endpoints; WAF on public entry
- [ ] Diagnostics + alerts; budget covers the new resources
