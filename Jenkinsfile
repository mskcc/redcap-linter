pipeline {
    agent { dockerfile true }
    stages {
        stage('build') {
            steps {
                sh 'python --version'
            }
        }
        stage('test') {
            steps {
                sh 'cd server && pytest -v'
            }
        }
    }
    post {
        always {
            emailext (
              subject: "Jenkins Build ${currentBuild.currentResult}: Job ${env.JOB_NAME}",
              body: "${currentBuild.currentResult}: Job ${env.JOB_NAME} build ${env.BUILD_NUMBER}\n More info at: ${env.BUILD_URL}",,
              to: 'perkinsc@mskcc.org'
            )
        }
    }
}
