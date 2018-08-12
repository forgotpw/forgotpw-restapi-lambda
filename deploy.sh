#!/bin/bash
# $1 - subdomain (api-dev, api)
# $2 - aws profile (default, fpwdev)
# $3 - environment abbrev used for s3 deploy bucket (dev)
echo "Deploying $1.forgotpw.com, AWS profile $2, s3://forgotpw-deploy-$3"
source ./exports.sh $1 $2
sls \
    deploy \
    --aws-profile $2 \
    --awsEnv dev \
    --verbose
