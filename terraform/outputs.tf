output "backend_url" {
  value = render_web_service.backend.url
}

output "frontend_url" {
  value = render_web_service.frontend.url
}

output "db_connection_string" {
  value     = render_postgres.db.connection_info.internal_connection_string
  sensitive = true
}
