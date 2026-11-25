# Enable the plugin matching your cloud; pin versions.
config {
  call_module_type = "local"
}

plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

plugin "aws" {
  enabled = true
  version = "0.50.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

# plugin "azurerm" {
#   enabled = true
#   version = "0.33.0"
#   source  = "github.com/terraform-linters/tflint-ruleset-azurerm"
# }

rule "terraform_naming_convention" { enabled = true }
rule "terraform_documented_variables" { enabled = true }
rule "terraform_documented_outputs" { enabled = true }
rule "terraform_typed_variables" { enabled = true }
