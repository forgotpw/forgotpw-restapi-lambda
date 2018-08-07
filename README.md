# Pwhint API lambda

API Gateway endpoints for api.forgotpw.com/v1/hint resources.

## Setup

Install the Serverless CLI.

```shell
# install the serverless framework
npm install serverless -g
```

## Usage - Prep Environment

The following environment variables must be exported before *ALL CALLS* to the serverless framework!

```shell
# will export environment variables needed for serverless.yml
source ./exports.sh api-dev fpwdev
```

## Usage - Deploy

```shell
sls \
    deploy \
    --aws-profile fpwdev \
    --awsEnv dev \
    --verbose
```

## Usage - Invoke Locally

Initial setup:

```shell
# ensure we are matching the version of node used by lambda
nvm use 8.10.0

sls invoke local \
    -f fpw-pwhint-api \
    -p ./events/ValidStoreGatewayRequest.json \
    -l
```

## Usage - Invoke Integration Tests

```shell
sls invoke test
```

## Usage - Test Live Endpoints

```shell
# request storing a password
curl -X PUT \
    --header "Content-Type: application/json" \
    -d '{"hint": "my hint", "application": "myapp", "phone": "609-555-1212"}' \
    https://api-dev.forgotpw.com/v1/hints

# request retrieving a password
curl -X POST \
    --header "Content-Type: application/json" \
    -d '{"application": "myapp", "phone": "609-555-1212"}' \
    https://api-dev.forgotpw.com/v1/hints
```

## Usage - View Logs

Tail log output from Lambda running in AWS:

```shell
sls logs -f fpw-pwhint-api -l \
    --awsEnv dev \
    --aws-profile fpwdev \
    -t
```

