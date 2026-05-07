#!/bin/sh

set -eu

ENDPOINT_URL="${DYNAMODB_ENDPOINT_URL:-http://dynamodb-local:8000}"
TABLE_NAME="${DYNAMODB_TABLE_NAME:-oblivion_messages}"
REGION="${AWS_REGION:-us-east-1}"
TTL_ATTRIBUTE="${DYNAMODB_TTL_ATTRIBUTE:-expireTime}"

echo "Waiting for DynamoDB Local at ${ENDPOINT_URL}..."
until aws dynamodb list-tables --endpoint-url "${ENDPOINT_URL}" --region "${REGION}" >/dev/null 2>&1; do
    sleep 1
done

if aws dynamodb describe-table \
    --table-name "${TABLE_NAME}" \
    --endpoint-url "${ENDPOINT_URL}" \
    --region "${REGION}" >/dev/null 2>&1; then
    echo "Table ${TABLE_NAME} already exists."
else
    echo "Creating table ${TABLE_NAME}..."
    aws dynamodb create-table \
        --table-name "${TABLE_NAME}" \
        --attribute-definitions AttributeName=messageId,AttributeType=S \
        --key-schema AttributeName=messageId,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url "${ENDPOINT_URL}" \
        --region "${REGION}" >/dev/null

    aws dynamodb wait table-exists \
        --table-name "${TABLE_NAME}" \
        --endpoint-url "${ENDPOINT_URL}" \
        --region "${REGION}"
fi

echo "Enabling TTL on ${TTL_ATTRIBUTE}..."
aws dynamodb update-time-to-live \
    --table-name "${TABLE_NAME}" \
    --time-to-live-specification "Enabled=true,AttributeName=${TTL_ATTRIBUTE}" \
    --endpoint-url "${ENDPOINT_URL}" \
    --region "${REGION}" >/dev/null || true

echo "DynamoDB initialization complete."
