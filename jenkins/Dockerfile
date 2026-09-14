# Local Jenkins for the life-dashboard pipeline: base Jenkins LTS + the
# Docker CLI (talks to the host daemon via the mounted socket - see
# docker-compose.jenkins.yml) + Terraform, with plugins and the initial
# setup wizard skipped via Configuration as Code (casc.yaml).
FROM jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl gnupg lsb-release && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list && \
    curl -fsSL https://apt.releases.hashicorp.com/gpg -o /etc/apt/keyrings/hashicorp.asc && \
    chmod a+r /etc/apt/keyrings/hashicorp.asc && \
    echo "deb [signed-by=/etc/apt/keyrings/hashicorp.asc] https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
        > /etc/apt/sources.list.d/hashicorp.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin terraform && \
    rm -rf /var/lib/apt/lists/*

# Local, single-user setup: run as root so the container's UID can reach the
# host's /var/run/docker.sock without fiddling with group GIDs across
# platforms (Docker Desktop's proxied socket permissions vary). Fine for a
# personal, non-shared Jenkins; a shared/production instance should instead
# add the jenkins user to a docker group matching the host's docker GID.
USER root
ENV JENKINS_AGENT_WORKDIR=/home/jenkins/agent

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

COPY casc.yaml /var/jenkins_home/casc.yaml
ENV CASC_JENKINS_CONFIG=/var/jenkins_home/casc.yaml
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
