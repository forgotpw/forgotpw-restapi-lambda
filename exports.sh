#!/bin/bash
echo "Exporting serverless environment variables using hostname $1.forgotpw.com AWS profile $2..."
export REST_API_ID=$( \
  aws apigateway get-rest-apis \
        --query 'items[?name==`'"$1"'.forgotpw.com`].[id]' \
        --output text \
        --profile $2)
echo "REST_API_ID: $REST_API_ID"
export ROOT_RESOURCE_ID=$( \
    aws apigateway get-resources \
        --rest-api-id $REST_API_ID \
        --query 'items[?path==`/`].[id]' \
        --output text \
        --profile $2)
echo "ROOT_RESOURCE_ID: $ROOT_RESOURCE_ID"
export V1_RESOURCE_ID=$( \
    aws apigateway get-resources \
        --rest-api-id $REST_API_ID \
        --query 'items[?path==`/v1`].[id]' \
        --output text \
        --profile $2)
echo "V1_RESOURCE_ID: $V1_RESOURCE_ID"
# needed to enable proper use of aws profiles with serverless framework
export AWS_SDK_LOAD_CONFIG=1
