#!/bin/bash
# Runs once on first boot. Installs Docker + the Compose plugin so the
# instance is ready for Jenkins to deploy onto (see scripts/deploy.sh) -
# nothing here starts the app itself.
set -euxo pipefail

apt-get update -y
apt-get install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

# Let the deploy user (ubuntu) run docker without sudo.
usermod -aG docker ubuntu

mkdir -p /opt/life-dashboard
chown ubuntu:ubuntu /opt/life-dashboard
