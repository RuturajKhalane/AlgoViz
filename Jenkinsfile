pipeline {
  agent {
    kubernetes {
      yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: dind
    image: docker:24-dind
    args: ["--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085", "--storage-driver=overlay2"]
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["cat"]
    tty: true
    securityContext:
      runAsUser: 0
      readOnlyRootFilesystem: false
    env:
    - name: KUBECONFIG
      value: /kube/config
    volumeMounts:
    - name: kubeconfig-secret
      mountPath: /kube/config
      subPath: kubeconfig
  volumes:
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
'''
    }
  }

  environment {
    REGISTRY = 'nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085'
    REPO     = 'my-repository'
    APP      = 'hello-world'
    // Tag with build number + short commit for uniqueness
    TAG      = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'local'}"
    IMAGE    = "${env.REGISTRY}/${env.REPO}/${env.APP}:${env.TAG}"
    NAMESPACE = 'ai-ns'
    PROJECT_SUBDIR = 'AlgoViz' // repo files live under this folder
  }

  stages {
    stage('Prepare') {
      steps {
        echo "Workspace: ${env.WORKSPACE}"
        sh "ls -la"
      }
    }

    stage('Login to Registry') {
      steps {
        container('dind') {
          withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
            sh '''
              docker --version
              sleep 2
              echo "$NEXUS_USER logging into $REGISTRY"
              docker login $REGISTRY -u $NEXUS_USER -p $NEXUS_PASS
            '''
          }
        }
      }
    }

    stage('Build') {
      steps {
        container('dind') {
          sh '''
            set -e
            cd ${PROJECT_SUBDIR}
            echo "Building image: $IMAGE from `pwd`"
            docker image inspect $IMAGE >/dev/null 2>&1 && docker rmi -f $IMAGE || true
            docker build -t $IMAGE .
            docker image ls $IMAGE
          '''
        }
      }
    }

    stage('Push') {
      steps {
        container('dind') {
          sh '''
            for i in 1 2 3; do
              docker push $IMAGE && break || {
                echo "Push failed, retry $i..."
                sleep $((i * 5))
              }
            done
          '''
        }
      }
    }

    stage('Create ImagePullSecret') {
      steps {
        container('kubectl') {
          withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
            sh '''
              kubectl get ns $NAMESPACE || kubectl create ns $NAMESPACE
              kubectl delete secret nexus-secret -n $NAMESPACE --ignore-not-found
              kubectl create secret docker-registry nexus-secret \
                --namespace $NAMESPACE \
                --docker-server=$REGISTRY \
                --docker-username=$NEXUS_USER \
                --docker-password=$NEXUS_PASS
            '''
          }
        }
      }
    }

    stage('Deploy') {
      steps {
        container('kubectl') {
          sh '''
            set -e
            # Optionally substitute image tag into manifest if manifest uses a placeholder
            # e.g.: sed -i "s|__IMAGE__|${IMAGE}|g" k8s/deployment.yaml

            kubectl apply -n $NAMESPACE -f k8s/deployment.yaml
            kubectl apply -n $NAMESPACE -f k8s/service.yaml

            echo "Waiting for rollout..."
            kubectl rollout status -n $NAMESPACE deploy/hello-world-deployment --timeout=180s || {
              echo "Rollout failed; dumping debug info..."
              kubectl describe deploy hello-world-deployment -n $NAMESPACE
              kubectl get pods -n $NAMESPACE -o wide
              kubectl logs -n $NAMESPACE -l app=hello-world --tail=200
              exit 1
            }
          '''
        }
      }
    }
  }

  post {
    failure {
      container('kubectl') {
        sh '''
          echo "Pipeline failed — printing last 200 lines of pods logs for debugging..."
          kubectl get pods -n $NAMESPACE -o wide || true
          kubectl logs -n $NAMESPACE -l app=hello-world --tail=200 || true
        '''
      }
    }
  }
}
