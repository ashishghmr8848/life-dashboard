variable "aws_region" {
  description = "AWS region to provision into."
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type. t3.micro is free-tier eligible for 12 months on a new AWS account."
  type        = string
  default     = "t3.micro"
}

variable "project_name" {
  description = "Prefix used to tag/name every resource this config creates."
  type        = string
  default     = "life-dashboard"
}

variable "ssh_public_key_path" {
  description = "Path to a local SSH public key file, imported as the EC2 key pair. Generate one with: ssh-keygen -t ed25519 -f ~/.ssh/life_dashboard_ec2"
  type        = string
  default     = "~/.ssh/life_dashboard_ec2.pub"
}

variable "ssh_ingress_cidr" {
  description = "CIDR allowed to reach the instance on port 22. Lock this to your own IP (e.g. \"1.2.3.4/32\") - do not leave it at 0.0.0.0/0 beyond a first test."
  type        = string
  default     = "0.0.0.0/0"
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size in GB."
  type        = number
  default     = 20
}
