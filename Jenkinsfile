pipeline {
    agent any

    environment {
        APP_NAME = "hospital-booking"
        CONTAINER_NAME = "hospital-booking"
        HOST_PORT = "4000"
        CONTAINER_PORT = "4000"
        NETWORK = "infra_default"
        ENV_FILE = "/var/lib/jenkins/workspace/env-files/.env-hospital-booking"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                docker build -t $APP_NAME:latest .
                '''
            }
        }

        stage('Stop Old Container') {
            steps {
                sh '''
                docker stop $CONTAINER_NAME || true
                docker rm $CONTAINER_NAME || true
                '''
            }
        }

        stage('Run New Container') {
            steps {
                sh '''
                docker run -d \
                  --name $CONTAINER_NAME \
                  --network $NETWORK \
                  --env-file $ENV_FILE \
                  -p $HOST_PORT:$CONTAINER_PORT \
                  --restart unless-stopped \
                  $APP_NAME:latest
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                sleep 10
                curl --fail http://localhost:$HOST_PORT
                '''
            }
        }
    }
}