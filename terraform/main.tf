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
  name            = "${var.project_name}-frontend"
  plan            = var.plan
  region          = var.region
  root_directory  = "frontend"

  runtime_source = {
    docker = {
      repo_url        = var.github_repo_url
      branch          = var.branch
      dockerfile_path = "./frontend/Dockerfile"
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
