// Life Dashboard: Claude Code -> Docker -> GitHub -> Jenkins -> Terraform ->
// AWS EC2 -> Docker Hub -> Deploy -> Live verification.
//
// Requires these Jenkins credentials (Manage Jenkins > Credentials):
//   dockerhub-creds     - Username/password, a Docker Hub access token
//   aws-creds           - AWS access key/secret with EC2 permissions
//   ec2-ssh-key         - SSH private key matching terraform's
//                         ssh_public_key_path, used to deploy over SSH
//   life-dashboard-jwt-secret   - Secret text, a real JWT signing secret
//   life-dashboard-db-password  - Secret text, the Postgres password
//
// PROVISION_AWS defaults to false: Build/Test/Push always run, but
// Terraform/Deploy/Verify (the stages that touch real, billable AWS
// resources) only run when explicitly opted into for a given build.
pipeline {
    agent any

    parameters {
        booleanParam(name: 'PROVISION_AWS', defaultValue: false,
            description: 'Run terraform apply, deploy to EC2, and verify. Leave off to just build/test/push images.')
        booleanParam(name: 'DESTROY_AFTER_VERIFY', defaultValue: false,
            description: 'Tear the EC2 instance back down (terraform destroy) once verification passes - handy for a one-shot demo run so nothing keeps billing.')
    }

    environment {
        DOCKERHUB_NAMESPACE = 'ashishghmr8848'
        IMAGE_TAG           = "${env.BUILD_NUMBER}"
        BACKEND_IMAGE       = "${DOCKERHUB_NAMESPACE}/life-dashboard-backend"
        FRONTEND_IMAGE      = "${DOCKERHUB_NAMESPACE}/life-dashboard-frontend"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            parallel {
                // Runs in the same base image as the backend Dockerfile
                // (python:3.12-slim) rather than whatever Python the Jenkins
                // host happens to ship, so the pinned requirements.txt
                // (psycopg2-binary in particular) resolves the same prebuilt
                // wheels production uses instead of trying to compile from
                // source against a mismatched Python.
                stage('Backend import smoke test') {
                    agent {
                        docker {
                            image 'python:3.12-slim'
                            reuseNode true
                        }
                    }
                    steps {
                        sh '''
                            pip install --quiet -r requirements.txt
                            python -c "import app.main"
                        '''
                    }
                }
                stage('Frontend lint + typecheck') {
                    agent {
                        docker {
                            image 'node:20-alpine'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('frontend') {
                            sh '''
                                npm ci
                                npm run lint
                                npx tsc -b --noEmit
                            '''
                        }
                    }
                }
            }
        }

        stage('Build images') {
            steps {
                sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ."
                sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest --build-arg VITE_API_BASE_URL= frontend"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_TOKEN')]) {
                    sh 'echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USER" --password-stdin'
                }
                sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${BACKEND_IMAGE}:latest"
                sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${FRONTEND_IMAGE}:latest"
            }
        }

        stage('Terraform: provision EC2') {
            when { expression { params.PROVISION_AWS } }
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-creds']]) {
                    dir('terraform') {
                        sh '''
                            terraform init -input=false
                            terraform apply -auto-approve -input=false
                            terraform output -raw instance_public_ip > ../ec2_host.txt
                        '''
                    }
                }
            }
        }

        stage('Deploy to EC2') {
            when { expression { params.PROVISION_AWS } }
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'EC2_SSH_KEY'),
                    string(credentialsId: 'life-dashboard-jwt-secret', variable: 'JWT_SECRET_KEY'),
                    string(credentialsId: 'life-dashboard-db-password', variable: 'POSTGRES_PASSWORD')
                ]) {
                    sh '''
                        export EC2_HOST=$(cat ec2_host.txt)
                        chmod +x scripts/deploy.sh
                        ./scripts/deploy.sh
                    '''
                }
            }
        }

        stage('Verify live application') {
            when { expression { params.PROVISION_AWS } }
            steps {
                sh '''
                    export EC2_HOST=$(cat ec2_host.txt)
                    chmod +x scripts/verify.sh
                    ./scripts/verify.sh
                '''
            }
        }

        stage('Terraform: destroy (optional)') {
            when { expression { params.PROVISION_AWS && params.DESTROY_AFTER_VERIFY } }
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-creds']]) {
                    dir('terraform') {
                        sh 'terraform destroy -auto-approve -input=false'
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }
        success {
            echo params.PROVISION_AWS
                ? "Built ${BACKEND_IMAGE}:${IMAGE_TAG}, pushed to Docker Hub, deployed to EC2, and verified live."
                : "Built and pushed ${BACKEND_IMAGE}:${IMAGE_TAG} / ${FRONTEND_IMAGE}:${IMAGE_TAG}. Re-run with PROVISION_AWS to deploy."
        }
    }
}
