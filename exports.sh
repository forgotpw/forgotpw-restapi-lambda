#!/bin/bash
if [ -z "$AWS_ENV" ]; then
    echo "AWS_ENV environment variable not present"
    exit 1
fi
if [ "$AWS_ENV" == "prod" ]; then
    export SUBDOMAIN="api"
else
    export SUBDOMAIN="api-$AWS_ENV"
fi
export PROFILE="fpw$AWS_ENV"
echo "Exporting serverless environment variables using hostname $SUBDOMAIN.forgotpw.com AWS profile $PROFILE..."
export REST_API_ID=$( \
  aws apigateway get-rest-apis \
        --query 'items[?name==`'"$SUBDOMAIN"'.forgotpw.com`].[id]' \
        --output text \
        --profile $PROFILE)
echo "REST_API_ID: $REST_API_ID"
export ROOT_RESOURCE_ID=$( \
    aws apigateway get-resources \
        --rest-api-id $REST_API_ID \
        --query 'items[?path==`/`].[id]' \
        --output text \
        --profile $PROFILE)
echo "ROOT_RESOURCE_ID: $ROOT_RESOURCE_ID"
export V1_RESOURCE_ID=$( \
    aws apigateway get-resources \
        --rest-api-id $REST_API_ID \
        --query 'items[?path==`/v1`].[id]' \
        --output text \
        --profile $PROFILE)
echo "V1_RESOURCE_ID: $V1_RESOURCE_ID"
# needed to enable proper use of aws profiles with serverless framework
export AWS_SDK_LOAD_CONFIG=1
