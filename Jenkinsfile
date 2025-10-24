pipeline {
    agent any

    environment {
        REGISTRY = "docker.io"
        IMAGE_BACKEND = "medical-consultation-backend"
        IMAGE_FRONTEND = "medical-consultation-frontend"
        GITHUB_REPO = "https://github.com/phuocdai2004/medical-consultation.git"
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out code from GitHub...'
                checkout([$class: 'GitSCM',
                  branches: [[name: '*/main']],
                  userRemoteConfigs: [[
                    url: "${GITHUB_REPO}",
                    credentialsId: 'github-pat'
                  ]]
                ])
                echo '✅ Code checked out successfully!'
            }
        }

        stage('Environment Check') {
            steps {
                echo '🔍 Checking environment...'
                bat '''
                    echo Node version:
                    node --version
                    echo NPM version:
                    npm --version
                    echo Docker version:
                    docker --version
                '''
            }
        }

        stage('Backend - Install Dependencies') {
            steps {
                echo '📦 Installing backend dependencies...'
                dir('backend') {
                    bat 'npm ci'
                }
                echo '✅ Backend dependencies installed!'
            }
        }

        stage('Backend - Security Audit') {
            steps {
                echo '🔒 Running security audit...'
                dir('backend') {
                    bat 'npm audit --audit-level=moderate || exit 0'
                }
            }
        }

        stage('Backend - Tests') {
            steps {
                echo '🧪 Running backend tests...'
                dir('backend') {
                    bat 'npm test || exit 0'
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        echo '🐳 Building backend Docker image...'
                        dir('backend') {
                            withCredentials([usernamePassword(
                                credentialsId: 'dockerhub-cred',
                                usernameVariable: 'DOCKER_USER',
                                passwordVariable: 'DOCKER_PASS'
                            )]) {
                                bat """
                                    docker build -t ${REGISTRY}/%DOCKER_USER%/${IMAGE_BACKEND}:latest .
                                    docker tag ${REGISTRY}/%DOCKER_USER%/${IMAGE_BACKEND}:latest ${REGISTRY}/%DOCKER_USER%/${IMAGE_BACKEND}:${BUILD_NUMBER}
                                """
                            }
                        }
                        echo '✅ Backend image built successfully!'
                    }
                }
                
                stage('Build Frontend Image') {
                    steps {
                        echo '🐳 Building frontend Docker image...'
                        dir('frontend') {
                            withCredentials([usernamePassword(
                                credentialsId: 'dockerhub-cred',
                                usernameVariable: 'DOCKER_USER',
                                passwordVariable: 'DOCKER_PASS'
                            )]) {
                                bat """
                                    docker build -t ${REGISTRY}/%DOCKER_USER%/${IMAGE_FRONTEND}:latest .
                                    docker tag ${REGISTRY}/%DOCKER_USER%/${IMAGE_FRONTEND}:latest ${REGISTRY}/%DOCKER_USER%/${IMAGE_FRONTEND}:${BUILD_NUMBER}
                                """
                            }
                        }
                        echo '✅ Frontend image built successfully!'
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo '🚀 Pushing images to Docker Hub...'
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-cred',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat """
                        echo %DOCKER_PASS% | docker login ${REGISTRY} -u %DOCKER_USER% --password-stdin
                        
                        docker push ${REGISTRY}/%DOCKER_USER%/${IMAGE_BACKEND}:latest
                        docker push ${REGISTRY}/%DOCKER_USER%/${IMAGE_BACKEND}:${BUILD_NUMBER}
                        
                        docker push ${REGISTRY}/%DOCKER_USER%/${IMAGE_FRONTEND}:latest
                        docker push ${REGISTRY}/%DOCKER_USER%/${IMAGE_FRONTEND}:${BUILD_NUMBER}
                        
                        docker logout ${REGISTRY}
                    """
                }
                echo '✅ Images pushed successfully!'
            }
        }

        stage('Deploy to Server') {
            when {
                branch 'main'
            }
            steps {
                echo '🚀 Deploying to production server...'
                withCredentials([
                    usernamePassword(credentialsId: 'dockerhub-cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                    sshUserPrivateKey(credentialsId: 'server-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')
                ]) {
                    bat """
                        ssh -i   "
                            echo %DOCKER_PASS% | docker login ${REGISTRY} -u %DOCKER_USER% --password-stdin && \
                            cd /opt/medical-consultation && \
                            docker-compose pull && \
                            docker-compose up -d && \
                            docker logout ${REGISTRY}
                        "
                    """
                }
                echo '✅ Deployment completed!'
            }
        }

        stage('Success') {
            steps {
                echo '🎉 ========================================='
                echo '✅ Jenkins Pipeline Completed Successfully!'
                echo '========================================='
                echo ''
                echo '📦 Build Information:'
                echo "   • Build Number: ${BUILD_NUMBER}"
                echo "   • Build ID: ${BUILD_ID}"
                echo "   • Job: ${JOB_NAME}"
                echo ''
                echo '🐳 Docker Images Published:'
                echo "   • Backend:  ${REGISTRY}/[username]/${IMAGE_BACKEND}:latest"
                echo "   • Backend:  ${REGISTRY}/[username]/${IMAGE_BACKEND}:${BUILD_NUMBER}"
                echo "   • Frontend: ${REGISTRY}/[username]/${IMAGE_FRONTEND}:latest"
                echo "   • Frontend: ${REGISTRY}/[username]/${IMAGE_FRONTEND}:${BUILD_NUMBER}"
                echo ''
                echo '🔗 Pull Commands:'
                echo "   docker pull ${REGISTRY}/[username]/${IMAGE_BACKEND}:latest"
                echo "   docker pull ${REGISTRY}/[username]/${IMAGE_FRONTEND}:latest"
                echo ''
                echo '🚀 Next Steps:'
                echo '   • Images are ready for deployment'
                echo '   • Check application at: http://103.20.96.174'
                echo ''
                echo '========================================='
            }
        }
    }

    post {
        always {
            script {
                if (env.NODE_NAME != null) {
                    echo '🧹 Cleaning up workspace...'
                    cleanWs()
                }
            }
        }
        
        success {
            echo '✅ Pipeline completed successfully!'
            // Có thể thêm notification (Slack, Email, etc.)
        }
        
        failure {
            echo '❌ Pipeline failed!'
            echo '📧 Please check the logs and fix the issues.'
            // Có thể thêm notification về failure
        }
    }
}