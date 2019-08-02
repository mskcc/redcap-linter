pipeline {
    environment {
        registry = 'perkinsc/redcap-linter'
        registryCredential = 'dockerhub'
        dockerImage = ''
    }
    agent any
    stages {
        stage('build') {
          agent { dockerfile true }
            steps {
                sh 'python --version'
            }
        }
        stage('test') {
            agent { dockerfile true }
            steps {
                sh 'cd server && pytest -v'
            }
        }
        stage('Building image') {
          steps{
            script {
              dockerImage = docker.build registry + ":$BUILD_NUMBER"
            }
          }
        }
        stage('Deploy Image') {
          steps{
            script {
              docker.withRegistry( '', registryCredential ) {
                dockerImage.push()
              }
            }
          }
        }
        stage('Remove Unused docker image') {
          steps{
            sh "docker rmi $registry:$BUILD_NUMBER"
          }
        }
    }
    post {
        failure {
            emailext (
              subject: "Jenkins Build ${currentBuild.currentResult}: Job ${env.JOB_NAME}",
              body: "${currentBuild.currentResult}: Job ${env.JOB_NAME} build ${env.BUILD_NUMBER}\n More info at: ${env.BUILD_URL}",,
              to: 'perkinsc@mskcc.org'
            )
        }
    }
}
