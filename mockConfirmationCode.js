const AWS = require('aws-sdk')
const PhoneTokenService = require('phone-token-service')

async function writeTestConfirmationCode(confirmationCode, phone, isExpired) {
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
      TableName: 'fpw_confirmation_code',
      Item:{
          "UserToken": userToken,
          "Code": confirmationCode,
          "ExpireTime": expireEpoch
      }
  };

  console.log(`Storing confirmation code ${confirmationCode} to Dynamodb for ${userToken}...`)
  try {
    await docClient.put(params).promise()
  }
  catch (err) {
    console.error("Unable to write confirmation code to Dynamodb: ", JSON.stringify(err, null, 2))
    throw err
  }
  return `${confirmationCode} ${isExpired ? 'invalid' : 'valid'} for phone: ${phone} token: ${userToken}`
}

module.exports = writeTestConfirmationCode

require('make-runnable')
