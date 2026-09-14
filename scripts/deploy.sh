#!/usr/bin/env bash
# Deploys the app to an already-provisioned EC2 host: copies
# docker-compose.prod.yml over, writes the env file, pulls the images Jenkins
# just pushed to Docker Hub, and (re)starts the stack.
#
# Called from the Jenkinsfile's Deploy stage. Run by hand as:
#   EC2_HOST=1.2.3.4 EC2_SSH_KEY=~/.ssh/life_dashboard_ec2 \
#   DOCKERHUB_NAMESPACE=ashishghmr8848 IMAGE_TAG=42 \
#   JWT_SECRET_KEY=... POSTGRES_PASSWORD=... ./scripts/deploy.sh
set -euo pipefail

: "${EC2_HOST:?set EC2_HOST to the instance's public IP (terraform output instance_public_ip)}"
: "${EC2_SSH_KEY:?set EC2_SSH_KEY to the private key path matching terraform's ssh_public_key_path}"
: "${DOCKERHUB_NAMESPACE:?set DOCKERHUB_NAMESPACE (e.g. ashishghmr8848)}"
: "${IMAGE_TAG:?set IMAGE_TAG (Jenkins build number / git sha)}"
: "${JWT_SECRET_KEY:?set JWT_SECRET_KEY - a real secret, not the .env.example placeholder}"
: "${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD - a real secret, not the docker-compose.yml dev default}"

EC2_USER="${EC2_USER:-ubuntu}"
REMOTE_DIR="/opt/life-dashboard"
SSH="ssh -o StrictHostKeyChecking=accept-new -i ${EC2_SSH_KEY} ${EC2_USER}@${EC2_HOST}"

echo "==> Copying docker-compose.prod.yml to ${EC2_HOST}:${REMOTE_DIR}"
scp -o StrictHostKeyChecking=accept-new -i "${EC2_SSH_KEY}" \
  docker-compose.prod.yml "${EC2_USER}@${EC2_HOST}:${REMOTE_DIR}/docker-compose.prod.yml"

echo "==> Writing .env on the host"
${SSH} "cat > ${REMOTE_DIR}/.env" <<EOF
DOCKERHUB_NAMESPACE=${DOCKERHUB_NAMESPACE}
IMAGE_TAG=${IMAGE_TAG}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
EOF

echo "==> Pulling images and restarting the stack"
${SSH} "cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d"

echo "==> Deployed ${DOCKERHUB_NAMESPACE}/life-dashboard-{backend,frontend}:${IMAGE_TAG} to ${EC2_HOST}"
