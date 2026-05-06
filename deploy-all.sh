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
kubectl delete -f "$API_DIR"/k8s/dynamodb-service.yaml --ignore-not-found
kubectl delete -f "$API_DIR"/k8s/dynamodb-deployment.yaml --ignore-not-found
kubectl delete -f "$API_DIR"/k8s/configmap.yaml --ignore-not-found
kubectl delete -f "$API_DIR"/k8s/service.yaml
kubectl delete -f "$API_DIR"/k8s/deployment.yaml
kubectl apply -f "$API_DIR"/k8s/configmap.yaml
kubectl apply -f "$API_DIR"/k8s/dynamodb-deployment.yaml
kubectl apply -f "$API_DIR"/k8s/dynamodb-service.yaml
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

echo "-------------------------------------------"
echo "Initializing DynamoDB table..."
kubectl rollout status deployment/oblivion-dynamodb-local --timeout=120s
ATTEMPTS=12
for _ in $(seq 1 "$ATTEMPTS"); do
	DYNAMODB_ENDPOINTS=$(kubectl get endpoints oblivion-dynamodb-local -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null || true)
	if [ -n "$DYNAMODB_ENDPOINTS" ]; then
		break
	fi
	sleep 10
done

if [ -z "$DYNAMODB_ENDPOINTS" ]; then
	echo "DynamoDB service has no ready endpoints."
	kubectl get pods -l app=oblivion-dynamodb-local || true
	kubectl describe service oblivion-dynamodb-local || true
	exit 1
fi

kubectl delete pod aws-cli-init --ignore-not-found
kubectl run aws-cli-init \
	--restart=Never \
	--image=amazon/aws-cli:latest \
	--env="AWS_REGION=us-east-1" \
	--env="AWS_ACCESS_KEY_ID=dummy" \
	--env="AWS_SECRET_ACCESS_KEY=dummy" \
	--command -- sh -c '
		aws dynamodb describe-table \
			--table-name oblivion_messages \
			--endpoint-url http://oblivion-dynamodb-local:8000 \
		>/dev/null 2>&1 || \
		aws dynamodb create-table \
			--table-name oblivion_messages \
			--attribute-definitions AttributeName=messageId,AttributeType=S \
			--key-schema AttributeName=messageId,KeyType=HASH \
			--billing-mode PAY_PER_REQUEST \
			--endpoint-url http://oblivion-dynamodb-local:8000

		aws dynamodb wait table-exists \
			--table-name oblivion_messages \
			--endpoint-url http://oblivion-dynamodb-local:8000

		aws dynamodb update-time-to-live \
			--table-name oblivion_messages \
			--time-to-live-specification Enabled=true,AttributeName=expireTime \
			--endpoint-url http://oblivion-dynamodb-local:8000 || true
	'
ATTEMPTS=12
for _ in $(seq 1 "$ATTEMPTS"); do
	PHASE=$(kubectl get pod aws-cli-init -o jsonpath='{.status.phase}' 2>/dev/null || true)
	if [ "$PHASE" = "Succeeded" ]; then
		break
	fi
	if [ "$PHASE" = "Failed" ]; then
		kubectl logs pod/aws-cli-init || true
		exit 1
	fi
	sleep 10
done

PHASE=$(kubectl get pod aws-cli-init -o jsonpath='{.status.phase}' 2>/dev/null || true)
if [ "$PHASE" != "Succeeded" ]; then
	kubectl logs pod/aws-cli-init || true
	exit 1
fi
kubectl logs pod/aws-cli-init
kubectl delete pod aws-cli-init --ignore-not-found
