terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "domain" {
  description = "Domain name"
  type        = string
}

variable "worker_name" {
  description = "Cloudflare Worker name"
  type        = string
  default     = "docs-worker"
}

variable "origin_ip" {
  description = "Origin server IP"
  type        = string
}

# A record for root domain (uncomment when you have a real origin IP)
# resource "cloudflare_record" "this" {
#   zone_id = var.zone_id
#   name    = var.domain
#   content = var.origin_ip
#   type    = "A"
#   ttl     = 1
#   proxied = true
# }

resource "cloudflare_worker_route" "docs" {
  zone_id     = var.zone_id
  pattern     = "docs.khangduytran.xyz/*"
  script_name = var.worker_name
}
