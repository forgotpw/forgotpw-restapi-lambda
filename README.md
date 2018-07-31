# Pwhint API lambda

API Gateway endpoints for api.forgotpw.com/v1/hint resources.

## Setup

Install the Serverless CLI.

```shell
# install the serverless framework
npm install serverless -g

# create the .env file for use with invoke local
cd src
npm install serverless-export-env --save-dev
# serverless invoke local has a bug with environment variables
# https://github.com/serverless/serverless/issues/3080
# serverless-export-env plugin takes the environment variables defines
# in serverless.yml for the lambda function and creates the .env file
# https://github.com/arabold/serverless-export-env
serverless export-env
```

## Usage - Prep Environment

The following environment variables must be exported before *ALL CALLS* to the serverless framework!

```shell
export REST_API_ID=$( \
    aws apigateway get-rest-apis \
        --query 'items[?name==`api-dev.forgotpw.com`].[id]' \
        --output text \
        --profile fpwdev)
export ROOT_RESOURCE_ID=$( \
    aws apigateway get-resources \
        --rest-api-id $REST_API_ID \
        --query 'items[?path==`/`].[id]' \
        --output text \
        --profile fpwdev)
export V1_RESOURCE_ID=$( \
    aws apigateway get-resources \
        --rest-api-id $REST_API_ID \
        --query 'items[?path==`/v1`].[id]' \
        --output text \
        --profile fpwdev)
export AWS_SDK_LOAD_CONFIG=1
```

## Usage - Deploy

```shell
serverless \
    deploy \
    --aws-profile fpwdev \
    --awsEnv dev \
    --verbose
```

## Usage - Invoke Locally

Initial setup:

```shell
cd src
serverless invoke local \
    -f fpw-pwhint-api \
    -p ../events/ApiGatewayEvent.json \
    -l
```

## Usage - Invoke Integration Tests

```shell
sls invoke test -f fpw-pwhint-api
```

## Usage - View Logs

Tail log output from Lambda running in AWS:

```shell
cd src
serverless logs -f fpw-pwhint-api -l \
    --awsEnv dev \
    --aws-profile fpwdev \
    -t
```

