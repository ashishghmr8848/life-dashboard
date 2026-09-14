variable "project_name" {
  description = "Prefix used to name every Render resource this config creates."
  type        = string
  default     = "life-dashboard"
}

variable "region" {
  description = "Render region."
  type        = string
  default     = "oregon"
}

variable "plan" {
  description = "Render plan for both web services. \"free\" spins the service down after inactivity and cold-starts on the next request - fine for a demo; upgrade to \"starter\" for an always-on service."
  type        = string
  default     = "free"
}

variable "db_plan" {
  description = "Render Postgres plan."
  type        = string
  default     = "free"
}

variable "github_repo_url" {
  description = "HTTPS URL of the GitHub repo Render builds both services from."
  type        = string
  default     = "https://github.com/ashishghmr8848/life-dashboard"
}

variable "branch" {
  description = "Branch Render auto-deploys from."
  type        = string
  default     = "main"
}

variable "jwt_secret_key" {
  description = "Real JWT signing secret for the deployed backend - never the .env.example placeholder."
  type        = string
  sensitive   = true
}
