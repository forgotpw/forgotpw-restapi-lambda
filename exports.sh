export REST_API_ID=$( \
    aws apigateway get-rest-apis \
        --query 'items[?name==`api-dev.forgotpw.com`].[id]' \
        --output text \
        --profile fpwdev)
echo "REST_API_ID: $REST_API_ID"
export ROOT_RESOURCE_ID=$( \
    aws apigateway get-resources \
        --rest-api-id $REST_API_ID \
        --query 'items[?path==`/`].[id]' \
        --output text \
        --profile fpwdev)
echo "ROOT_RESOURCE_ID: $ROOT_RESOURCE_ID"
export V1_RESOURCE_ID=$( \
    aws apigateway get-resources \
        --rest-api-id $REST_API_ID \
        --query 'items[?path==`/v1`].[id]' \
        --output text \
        --profile fpwdev)
echo "V1_RESOURCE_ID: $V1_RESOURCE_ID"
# needed to enable proper use of aws profiles with serverless framework
export AWS_SDK_LOAD_CONFIG=1
