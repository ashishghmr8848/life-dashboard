terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local state by default (fine for a single-instance personal project).
  # Switch to an S3 backend once more than one person/machine runs apply:
  #
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "life-dashboard/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}
