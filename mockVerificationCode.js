const AWS = require('aws-sdk')
const PhoneTokenService = require('phone-token-service')

async function writeTestVerificationCode(verificationCode, phone, isExpired) {
  const phoneTokenService = new PhoneTokenService({
    tokenHashHmac: process.env.USERTOKEN_HASH_HMAC,
    s3bucket: process.env.USERTOKENS_S3_BUCKET,
    defaultCountryCode: 'US'
  })
  let userToken = await phoneTokenService.getTokenFromPhone(phone)

  const docClient = new AWS.DynamoDB.DocumentClient()

  // make sure it's a valid, not expired code
  let expireEpoch = null
  if (isExpired) {
    // make it already expired
    expireEpoch = (new Date).getTime() - 1000
  } else {
    expireEpoch = (new Date).getTime() + (1000 * 60 * 15)
  }
  expireEpoch = Math.round(expireEpoch / 1000)

  const params = {
      TableName: 'fpw_verification_code',
      Item:{
          "UserToken": userToken,
          "Code": verificationCode,
          "ExpireTime": expireEpoch
      }
  };

  console.log(`Storing verification code ${verificationCode} to Dynamodb for ${userToken}...`)
  try {
    await docClient.put(params).promise()
  }
  catch (err) {
    console.error("Unable to write verification code to Dynamodb: ", JSON.stringify(err, null, 2))
    throw err
  }
  return `${verificationCode} ${isExpired ? 'invalid' : 'valid'} for phone: ${phone} token: ${userToken}`
}

module.exports = writeTestVerificationCode

require('make-runnable')
