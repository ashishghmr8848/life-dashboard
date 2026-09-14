terraform {
  required_version = ">= 1.5"

  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.0"
    }
  }
}

provider "render" {
  # Auth via RENDER_API_KEY / RENDER_OWNER_ID env vars (set by the
  # Jenkinsfile's credentials binding, or export both yourself to run by
  # hand). Generate an API key from the Render dashboard's Account
  # Settings; the owner id (usr-... for a personal account, tea-... for a
  # team) is shown in the same place.
}
