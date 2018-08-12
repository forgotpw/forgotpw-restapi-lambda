#!/bin/bash
[ -z "$API_SUBDOMAIN" ] && echo "Need to set API_SUBDOMAIN (e.g. api-dev)" && exit 1;

echo "Exporting serverless environment variables using hostname $API_SUBDOMAIN.forgotpw.com..."

export REST_API_ID=$( \
    aws apigateway get-rest-apis \
      --query 'items[?name==`'"$API_SUBDOMAIN"'.forgotpw.com`].[id]' \
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
