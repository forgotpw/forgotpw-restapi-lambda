#!/bin/bash
echo "Exporting serverless environment variables using hostname $1.forgotpw.com..."
export REST_API_ID=$( \
    aws apigateway get-rest-apis \
      --query 'items[?name==`'"$1"'.forgotpw.com`].[id]' \
      --output text)
echo "REST_API_ID: $REST_API_ID"
export ROOT_RESOURCE_ID=$( \
    aws apigateway get-resources \
      --rest-api-id $REST_API_ID \
      --query 'items[?path==`/`].[id]' \
      --output text)
echo "ROOT_RESOURCE_ID: $ROOT_RESOURCE_ID"
export V1_RESOURCE_ID=$( \
    aws apigateway get-resources \
      --rest-api-id $REST_API_ID \
      --query 'items[?path==`/v1`].[id]' \
      --output text)
echo "V1_RESOURCE_ID: $V1_RESOURCE_ID"
sls invoke test
