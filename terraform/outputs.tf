output "instance_public_ip" {
  description = "Public IP of the app instance - Jenkins deploys to this and the verify stage curls it."
  value       = aws_instance.app.public_ip
}

output "instance_id" {
  value = aws_instance.app.id
}

output "ssh_command" {
  value = "ssh -i <path-to-private-key> ubuntu@${aws_instance.app.public_ip}"
}

output "app_url" {
  value = "http://${aws_instance.app.public_ip}"
}
