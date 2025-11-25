pipeline {
  agent {
    kubernetes {
      yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:latest
    args: ["--no-push"]
    tty: true
    securityContext:
      runAsUser: 0
    volumeMounts:
    - name: workspace-volume
      mountPath: /workspace
    - name: docker-config
      mountPath: /kaniko/.docker
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
    - name: workspace-volume
      mountPath: /workspace
  volumes:
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
  - name: workspace-volume
    emptyDir: {}
  - name: docker-config
    emptyDir: {}
'''
    }
  }

  environment {
    REGISTRY = 'nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085'
    REPO     = 'my-repository'
    APP      = 'hello-world'
    TAG      = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'local'}"
    IMAGE    = "${env.REGISTRY}/${env.REPO}/${env.APP}:${env.TAG}"
    NAMESPACE = 'ai-ns'
    PROJECT_SUBDIR = 'AlgoViz'
    // Kaniko context path inside the pod (workspace is mounted at /workspace)
    CONTEXT_DIR = "/workspace/${env.PROJECT_SUBDIR}"
  }

  stages {
    stage('Prepare') {
      steps {
        echo "Workspace: ${env.WORKSPACE}"
        sh 'ls -la'
      }
    }

    stage('Create docker config for Kaniko') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
          // run in the default jnlp container (injected by the plugin)
          container('jnlp') {
            sh '''
              set -e
              mkdir -p /workspace/.docker
              AUTH=$(printf "%s:%s" "$NEXUS_USER" "$NEXUS_PASS" | base64 -w0)
              cat > /workspace/.docker/config.json <<EOF
{
  "auths": {
    "${REGISTRY}": {
      "auth": "${AUTH}"
    }
  }
}
EOF
              ls -la /workspace/.docker || true
            '''
          }
        }
      }
    }

    stage('Build & Push (Kaniko)') {
      steps {
        container('kaniko') {
          sh '''
            set -e
            echo "Preparing Kaniko docker config..."
            # Copy config generated in workspace into kaniko's docker config mount
            if [ -d /workspace/.docker ]; then
              cp -r /workspace/.docker/* /kaniko/.docker/ || true
            fi
            echo "Config files in /kaniko/.docker:"
            ls -la /kaniko/.docker || true

            echo "Context: ${CONTEXT_DIR}"
            ls -la ${CONTEXT_DIR}

            /kaniko/executor \
              --context ${CONTEXT_DIR} \
              --dockerfile ${CONTEXT_DIR}/Dockerfile \
              --destination ${IMAGE} \
              --cache=true \
              --cache-dir /workspace/.kaniko_cache \
              --insecure \
              --skip-tls-verify \
              --verbosity info
          '''
        }
      }
    }

    stage('Create ImagePullSecret') {
      steps {
        container('kubectl') {
          withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
            sh '''
              set -e
              kubectl get ns ${NAMESPACE} || kubectl create ns ${NAMESPACE}
              kubectl delete secret nexus-secret -n ${NAMESPACE} --ignore-not-found
              kubectl create secret docker-registry nexus-secret \
                --namespace ${NAMESPACE} \
                --docker-server=${REGISTRY} \
                --docker-username=${NEXUS_USER} \
                --docker-password=${NEXUS_PASS}
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
            if grep -q "__IMAGE__" k8s/deployment.yaml 2>/dev/null; then
              sed -e "s|__IMAGE__|${IMAGE}|g" k8s/deployment.yaml > /workspace/deployment.tmp.yaml
              kubectl apply -n ${NAMESPACE} -f /workspace/deployment.tmp.yaml
            else
              kubectl apply -n ${NAMESPACE} -f k8s/deployment.yaml
            fi

            if [ -f k8s/service.yaml ]; then
              kubectl apply -n ${NAMESPACE} -f k8s/service.yaml
            fi

            echo "Waiting for rollout..."
            kubectl rollout status -n ${NAMESPACE} deploy/hello-world-deployment --timeout=180s || {
              echo "Rollout failed; dumping debug info..."
              kubectl describe deploy hello-world-deployment -n ${NAMESPACE} || true
              kubectl get pods -n ${NAMESPACE} -o wide || true
              kubectl logs -n ${NAMESPACE} -l app=hello-world --tail=200 || true
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
          kubectl get pods -n ${NAMESPACE} -o wide || true
          kubectl logs -n ${NAMESPACE} -l app=hello-world --tail=200 || true
        '''
      }
    }
  }
}
