#!/bin/bash

if [ -z "$AWS_ENV" ]; then
    echo "Need to set AWS_ENV"
    exit 1
fi 

# will export environment variables needed for serverless.yml

if [ -z "$AWS_ENV" ]; then
    echo "AWS_ENV environment variable not present"
    exit 1
fi
if [ "$AWS_ENV" == "prod" ]; then
    export SUBDOMAIN="api"
else
    export SUBDOMAIN="api-$AWS_ENV"
fi
echo "Subdomain: $SUBDOMAIN"

echo "Exporting serverless environment variables using hostname $SUBDOMAIN.forgotpw.com"
export REST_API_ID=$( \
  aws apigateway get-rest-apis \
        --query 'items[?name==`'"$SUBDOMAIN"'.rosa.bot`].[id]' \
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
