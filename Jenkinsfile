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
    args: ["--no-push"]   # default args; actual args will be provided in the step
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
  # jnlp container is injected by the Jenkins Kubernetes plugin automatically
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
    # Kaniko context path inside the pod (workspace is mounted at /workspace)
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
        // create a docker config.json that Kaniko will use for auth
        withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
          container('jnlp') {
            sh '''
              set -e
              mkdir -p /workspace/.docker
              # create basic docker config.json for Kaniko auth
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
              # Mirror the config into the kaniko mount (docker-config emptyDir is mounted to /kaniko/.docker in kaniko)
              cp -r /workspace/.docker/* /kaniko/.docker/ || true
              ls -la /kaniko/.docker || true
            '''
          }
        }
      }
    }

    stage('Build & Push (Kaniko)') {
      steps {
        container('kaniko') {
          // Kaniko needs --context pointing to the repo directory and --destination for the image
          // We use --insecure and --skip-tls-verify for the insecure registry (adjust if your registry has TLS)
          sh '''
            set -e
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
              # create or replace secret in the target namespace so Kubernetes pods can pull the image
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
            # If your k8s manifest references the image directly, substitute it here.
            # Example: replace __IMAGE__ placeholder in deployment manifest
            if grep -q "__IMAGE__" k8s/deployment.yaml 2>/dev/null; then
              sed -e "s|__IMAGE__|${IMAGE}|g" k8s/deployment.yaml > /workspace/deployment.tmp.yaml
              kubectl apply -n ${NAMESPACE} -f /workspace/deployment.tmp.yaml
            else
              kubectl apply -n ${NAMESPACE} -f k8s/deployment.yaml
            fi

            # apply service if present
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
