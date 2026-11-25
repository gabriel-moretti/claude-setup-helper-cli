# Module: Terraform

Applies to any repo with `infra/**/*.tf`. Cloud-specific rules live in `aws.md` / `azure.md`.

## 1. Layout
```
infra/
  modules/<name>/      main.tf variables.tf outputs.tf versions.tf README.md (terraform-docs) tests/
  envs/<env>/          main.tf backend.tf providers.tf terraform.tfvars versions.tf
  .tflint.hcl
```
- **MUST** one state per environment (and per large component when blast radius matters). Environments are directories, not workspaces.
- **MUST** reusable modules for repeated patterns; envs only compose modules and set variables.
- **AVOID** modules that just wrap a single resource without adding policy/defaults.

## 2. Versions and state
- **MUST** `required_version` and provider constraints (`~>`), and commit `.terraform.lock.hcl` with hashes for CI and dev platforms (`terraform providers lock -platform=linux_amd64 -platform=darwin_arm64`).
- **MUST** remote state with locking and encryption: S3 backend with `use_lockfile = true` (AWS) or azurerm backend (blob lease). State bucket/account versioned, access restricted — state contains secrets.
- **MUST** never edit state by hand; use `moved {}`, `import {}` and `removed {}` blocks reviewed in PRs.

## 3. Code
- **MUST** `terraform fmt`; typed variables with `description` and `validation` where inputs are constrained; outputs with descriptions; `sensitive = true` for secret outputs/variables.
- **MUST** `for_each` over `count` for collections (stable addresses); `count` only for on/off toggles.
- **MUST** tags via provider `default_tags` (AWS) or a common tags local (Azure) — `project`, `environment`, `criticality`, `owner`, `managed-by = "terraform"`.
- **MUST** `prevent_destroy` lifecycle on stateful prod resources (DBs, KMS keys, critical buckets).
- **AVOID** provisioners, `null_resource` scripting, hardcoded IDs/ARNs (use data sources or variables), secrets in `.tfvars`.

## 4. Quality gates (CI)
| Gate | Tool | When |
|---|---|---|
| Format | `terraform fmt -check -recursive` | PR |
| Validate | `terraform validate` per root | PR |
| Lint | `tflint` with aws/azurerm ruleset (`assets/modules/terraform/.tflint.hcl`) | PR |
| Security | Checkov (or Trivy config) | PR |
| Docs | `terraform-docs` check on modules | PR |
| Module tests | `terraform test` | PR touching `modules/` |
| Cost | Infracost diff comment (SHOULD) | PR |
| Plan | `terraform plan` via OIDC read-only | PR |
| Apply | saved plan, environment approval | merge to `main` / tag |
| Drift | scheduled `plan -detailed-exitcode` → issue (`assets/modules/terraform/drift.yml`) | weekly |

- **MUST** apply only from CI with the plan produced from the same commit; humans don't `apply` against prod from laptops.

## 5. AI tooling
- HashiCorp **Terraform MCP Server** ([hashicorp/terraform-mcp-server](https://github.com/hashicorp/terraform-mcp-server), Docker image) for registry/provider/module docs — fragment `assets/modules/terraform/mcp.json`. Pin the image tag. Agents propose code; plan/apply stay in CI.

## Review checklist
- [ ] Plan reviewed: no unexpected destroy/replace
- [ ] New resources tagged; stateful ones protected
- [ ] Lock file updated with provider bumps
- [ ] Checkov/tflint clean or suppressions justified inline
