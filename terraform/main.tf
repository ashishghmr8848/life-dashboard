# Latest Ubuntu 22.04 LTS AMI, owned by Canonical - avoids hardcoding an
# AMI id that goes stale or doesn't exist in the chosen region.
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "deployer" {
  key_name   = "${var.project_name}-deployer"
  public_key = file(var.ssh_public_key_path)
}

resource "aws_security_group" "app" {
  name        = "${var.project_name}-sg"
  description = "Allow SSH, HTTP, and the raw backend port for the ${var.project_name} app"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_ingress_cidr]
  }

  ingress {
    description = "HTTP - nginx serving the frontend + proxying /auth,/transactions,etc to the backend"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Backend API, exposed directly for the pipeline's health check and any direct API access"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-sg"
  }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.app.id]

  root_block_device {
    volume_size = var.root_volume_size_gb
    volume_type = "gp3"
  }

  # Installs Docker + the Compose plugin and leaves the box ready for Jenkins
  # to scp docker-compose.prod.yml + a .env onto it and run `docker compose
  # up -d` (see scripts/deploy.sh). Provisioning the instance and deploying
  # the app are kept as separate pipeline stages on purpose - re-running
  # apply should never require re-deploying the app, and vice versa.
  user_data = file("${path.module}/user_data.sh")

  tags = {
    Name = "${var.project_name}-app"
  }
}
