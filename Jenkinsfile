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
              subject: 'Test'
              body: 'A Test EMail',
              to: 'perkinsc@mskcc.org',
              recipientProviders: [[$class: 'RequesterRecipientProvider']]
            )
        }
    }
}
