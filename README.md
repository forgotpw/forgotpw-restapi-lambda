# Pwhint API lambda

![Build Status](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiUHEvbGM3RVU1eFZUVWxiYzVaWk1ybUN1RFJqQTR4anpkQk5mUUVoOWFKejNKUkNuVHYycVg4TzhFb3RTMGpHV2RmZE1ZY0dSNU44RmJYRHo5dG16eDVNPSIsIml2UGFyYW1ldGVyU3BlYyI6ImJtcnNQSU9XQjN0SWNWSTEiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=develop)

API Gateway REST endpoints for api.forgotpw.com/v1/.

## Setup

Install the Serverless CLI.

```shell
# install the serverless framework
npm install serverless -g
```

## Usage - Deploy

```shell
# will export environment variables needed for serverless.yml
source ./exports.sh api-dev fpwdev

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

# will export environment variables needed for serverless.yml
source ./exports.sh api-dev fpwdev

sls invoke local \
    -f fpw-pwhint-api \
    -p ./events/ValidStoreGatewayRequest.json \
    -l
```

## Usage - Invoke Integration Tests

```shell
# will export environment variables needed for serverless.yml
source ./exports.sh api-dev fpwdev

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

## Usage - Setup CI Environment

AWS CodeBuild needs a docker image to use for building, testing, and deploying the lambda function.  These steps build that environment and upload it to AWS for use with CodeBuild.

```shell
# build the docker image for the dev build environment
docker build -t forgotpw/restapi-lambda:build .

# create the docker repository
aws ecr create-repository \
    --repository-name forgotpw/restapi-lambda \
    --profile fpwdev

# allow codebuild access to pull from this ecr repo
aws ecr set-repository-policy \
	--repository-name forgotpw/restapi-lambda \
	--policy-text "$(cat ecr-repository-policy.json)" \
    --profile fpwdev

# authenticate local docker client with remote ecr repository
CMD=$(aws ecr get-login \
    --no-include-email \
    --region us-east-1 \
    --profile fpwdev)
eval $CMD

# tag the image so it can be pushed to the repository
docker tag \
    forgotpw/restapi-lambda:build \
    478543871670.dkr.ecr.us-east-1.amazonaws.com/forgotpw/restapi-lambda:build

# push to the remote repository
docker push \
    478543871670.dkr.ecr.us-east-1.amazonaws.com/forgotpw/restapi-lambda:build
```
