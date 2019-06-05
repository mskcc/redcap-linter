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
}
