# ForgotPW REST API Lambda

API Gateway REST endpoints for api.forgotpw.com/v1/.

## Setup

Install the Serverless CLI.

```shell
# install the serverless framework
npm install serverless -g
```

## Deploy

```shell
export AWS_ENV="dev" && export PROFILE="fpw$AWS_ENV"
# will export environment variables needed for serverless.yml
source ./exports.sh

iam-starter \
    --profile $PROFILE \
    --command sls deploy --verbose
```

## Invoke Locally

Initial setup:

```shell
#pip install iam-starter
#pip install ssm-starter
nvm use 8.10.0

export AWS_ENV="dev" && export PROFILE="fpw$AWS_ENV"
source ./exports.sh
export USERTOKENS_S3_BUCKET="forgotpw-usertokens-$AWS_ENV"
export AWS_REGION=us-east-1

# validate the 1234 verification code used in the sample event
AWS_ENV= iam-starter \
    --role role-ops-devops \
    --profile $PROFILE \
    --command ssm-starter \
    --ssm-name /fpw/ \
    --command node mockVerificationCode.js '1234' '609-555-1313' 0

iam-starter \
    --role role-ops-devops \
    --profile $PROFILE \
    --command sls invoke local \
    -f fpw-restapi \
    -p ./events/ValidGetAuthorizedRequest.json \
    -l
```

## Invoke Tests

```shell
#pip install iam-starter

export AWS_ENV="dev" && export PROFILE="fpw$AWS_ENV"
source ./exports.sh

iam-starter \
    --role role-ops-devops \
    --profile $PROFILE \
    --command sls invoke test
```

## Test Live Endpoints

```shell
# set this to whatever cell phone is used for testing
export PHONE="609-555-1212"
export SUBDOMAIN="api-dev"

# request a verification code
curl -X POST \
    --header "Content-Type: application/json" \
    -d '{"application": "myapp", "phone": "'$PHONE'"}' \
    https://$SUBDOMAIN.forgotpw.com/v1/codes

export CODE="1234" # result of actual verification request

# request storing a password
curl -X PUT \
    --header "Content-Type: application/json" \
    --header "X-FPW-VerificationCode: $CODE" \
    --header "X-FPW-CountryCode: US" \
    -d '{"secret": "my & secret", "application": "myapp", "phone": "'$PHONE'"}' \
    https://$SUBDOMAIN.forgotpw.com/v1/secrets

# request retrieving a password
curl -X POST \
    --header "Content-Type: application/json" \
    -d '{"application": "myapp", "phone": "'$PHONE'"}' \
    https://$SUBDOMAIN.forgotpw.com/v1/secrets

# request to nuke an account
curl -X POST \
    --header "Content-Type: application/json" \
    --header "X-FPW-VerificationCode: $CODE" \
    --header "X-FPW-CountryCode: US" \
    -d '{"phone": "'$PHONE'"}' \
    https://$SUBDOMAIN.forgotpw.com/v1/nuke
```

## View Logs

Tail log output from Lambda running in AWS:

```shell
export AWS_ENV="dev" && export PROFILE="fpw$AWS_ENV"

sls logs -f fpw-restapi -l \
    --aws-profile $PROFILE \
    -t
```

## Setup CI Environment

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

# License

GNU General Public License v3.0

See [LICENSE](LICENSE.txt) to see the full text.
