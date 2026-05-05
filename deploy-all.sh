echo "-------------------------------------------"
ROOT_DIR=$(pwd)
echo "Root directory: $ROOT_DIR"

BRANCH=${1:-"main"} 
echo "-------------------------------------------"
echo "Using branch: $BRANCH"

git fetch
git checkout "$BRANCH"
git reset --hard origin/"$BRANCH"

echo "-------------------------------------------"
echo "Deploying API..."
API_DIR="$ROOT_DIR"/api
DOCKER_BUILDKIT=1 docker build -t oblivion-api "$API_DIR"
docker tag oblivion-api localhost:32000/oblivion-api
docker push localhost:32000/oblivion-api
kubectl delete -f "$API_DIR"/k8s/service.yaml
kubectl delete -f "$API_DIR"/k8s/deployment.yaml
kubectl apply -f "$API_DIR"/k8s/deployment.yaml
kubectl apply -f "$API_DIR"/k8s/service.yaml
kubectl get pods
kubectl get services

echo "-------------------------------------------"
echo "Deploying UI..."
UI_DIR="$ROOT_DIR"/ui
docker build -t oblivion-ui "$UI_DIR"
docker tag oblivion-ui localhost:32000/oblivion-ui
docker push localhost:32000/oblivion-ui
kubectl delete -f "$UI_DIR"/k8s/service.yaml
kubectl delete -f "$UI_DIR"/k8s/deployment.yaml
kubectl apply -f "$UI_DIR"/k8s/deployment.yaml
kubectl apply -f "$UI_DIR"/k8s/service.yaml
kubectl get pods
kubectl get services