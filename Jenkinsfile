// Life Dashboard: Claude Code -> Docker -> GitHub -> Jenkins -> Terraform ->
// Render -> Docker Hub -> Deploy -> Live verification.
//
// Render builds and deploys straight from this GitHub repo's Dockerfiles
// (see terraform/main.tf's runtime_source.docker blocks with
// auto_deploy = true) - there's no separate SSH-into-a-VM deploy step.
// terraform apply's job is to create/update the render_web_service and
// render_postgres resources; Render's own auto_deploy is what actually
// builds and deploys on every push to the branch.
//
// Requires these Jenkins credentials (Manage Jenkins > Credentials):
//   dockerhub-creds        - Username/password, a Docker Hub access token
//   render-api-key         - Secret text, from Render's Account Settings
//   render-owner-id        - Secret text, usr-... or tea-..., same page
//   life-dashboard-jwt-secret - Secret text, a real JWT signing secret
//
// PROVISION_RENDER defaults to false: Build/Test/Push always run, but
// Terraform/Verify (the stage that touches real Render resources - some
// plans are billable) only runs when explicitly opted into for a given
// build.
pipeline {
    agent any

    parameters {
        booleanParam(name: 'PROVISION_RENDER', defaultValue: false,
            description: 'Run terraform apply against Render and verify the deployed services. Leave off to just build/test/push images.')
        booleanParam(name: 'DESTROY_AFTER_VERIFY', defaultValue: false,
            description: 'Tear the Render services back down (terraform destroy) once verification passes - handy for a one-shot demo run so nothing keeps billing/running.')
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

        stage('Terraform: provision Render services') {
            when { expression { params.PROVISION_RENDER } }
            steps {
                withCredentials([
                    string(credentialsId: 'render-api-key', variable: 'RENDER_API_KEY'),
                    string(credentialsId: 'render-owner-id', variable: 'RENDER_OWNER_ID'),
                    string(credentialsId: 'life-dashboard-jwt-secret', variable: 'TF_VAR_jwt_secret_key')
                ]) {
                    dir('terraform') {
                        sh '''
                            terraform init -input=false
                            terraform apply -auto-approve -input=false
                            terraform output -raw backend_url  > ../backend_url.txt
                            terraform output -raw frontend_url > ../frontend_url.txt
                        '''
                    }
                }
            }
        }

        stage('Verify live application') {
            when { expression { params.PROVISION_RENDER } }
            steps {
                sh '''
                    export BACKEND_URL=$(cat backend_url.txt)
                    export FRONTEND_URL=$(cat frontend_url.txt)
                    chmod +x scripts/verify.sh
                    ./scripts/verify.sh
                '''
            }
        }

        stage('Terraform: destroy (optional)') {
            when { expression { params.PROVISION_RENDER && params.DESTROY_AFTER_VERIFY } }
            steps {
                withCredentials([
                    string(credentialsId: 'render-api-key', variable: 'RENDER_API_KEY'),
                    string(credentialsId: 'render-owner-id', variable: 'RENDER_OWNER_ID'),
                    string(credentialsId: 'life-dashboard-jwt-secret', variable: 'TF_VAR_jwt_secret_key')
                ]) {
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
            echo params.PROVISION_RENDER
                ? "Built ${BACKEND_IMAGE}:${IMAGE_TAG}, pushed to Docker Hub, provisioned/updated Render, and verified live."
                : "Built and pushed ${BACKEND_IMAGE}:${IMAGE_TAG} / ${FRONTEND_IMAGE}:${IMAGE_TAG}. Re-run with PROVISION_RENDER to deploy."
        }
    }
}
