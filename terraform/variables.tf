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

variable "smtp_host" {
  description = "SMTP host for forgot-password emails (app/core/email.py). Defaults to Gmail's; email sending stays off regardless as long as smtp_username/smtp_password are blank - the app still works, it just logs the code instead."
  type        = string
  default     = "smtp.gmail.com"
}

variable "smtp_port" {
  type    = number
  default = 587
}

variable "smtp_username" {
  type      = string
  default   = ""
  sensitive = true
}

variable "smtp_password" {
  description = "An app password (e.g. Gmail), not a real account password."
  type        = string
  default     = ""
  sensitive   = true
}

variable "smtp_from" {
  description = "Defaults to smtp_username if left blank."
  type        = string
  default     = ""
}
