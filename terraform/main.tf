# Known render-oss/render provider quirk (hit live on the first real apply,
# provider v1.9.1): `terraform apply` against an EXISTING free-plan service
# whose runtime_source changes can fail with "Error updating service:
# ... maintenance mode can only be configured for non-free tier services" -
# the provider appears to always include a maintenanceMode field on service
# PATCH requests, which Render's API rejects for free-tier services even
# when unset/false. Terraform correctly computes the diff (confirmed: `plan`
# showed only the intended attribute changing) but the apply itself errors.
# Creating a NEW service, and `terraform destroy`, are unaffected - only
# updating an existing free-tier service's config hits this. If you hit it:
# either upgrade `plan` to "starter" for that service, or make the same
# change directly via the Render API/dashboard and reconcile state
# separately (e.g. `terraform apply -refresh-only`).
resource "render_postgres" "db" {
  name    = "${var.project_name}-db"
  plan    = var.db_plan
  region  = var.region
  version = "16"
}

resource "render_web_service" "backend" {
  name   = "${var.project_name}-backend"
  plan   = var.plan
  region = var.region

  runtime_source = {
    docker = {
      repo_url        = var.github_repo_url
      branch          = var.branch
      dockerfile_path = "./Dockerfile"
      auto_deploy     = true
    }
  }

  health_check_path = "/health"

  env_vars = {
    DATABASE_URL       = { value = render_postgres.db.connection_info.internal_connection_string }
    JWT_SECRET_KEY     = { value = var.jwt_secret_key }
    JWT_EXPIRE_MINUTES = { value = "10080" }
  }
}

resource "render_web_service" "frontend" {
  name           = "${var.project_name}-frontend"
  plan           = var.plan
  region         = var.region
  root_directory = "frontend"

  runtime_source = {
    docker = {
      repo_url        = var.github_repo_url
      branch          = var.branch
      # Relative to root_directory above, not the repo root - "./frontend/Dockerfile"
      # here would double up to frontend/frontend/Dockerfile (confirmed by a
      # real failed deploy: "no such file or directory").
      dockerfile_path = "./Dockerfile"
      auto_deploy     = true
    }
  }

  # nginx.conf.template envsubst's this in at container start (see
  # frontend/Dockerfile) - same image works unmodified in docker-compose
  # (BACKEND_ORIGIN defaults to the compose network's backend:8000).
  env_vars = {
    BACKEND_ORIGIN = { value = render_web_service.backend.url }
  }
}
