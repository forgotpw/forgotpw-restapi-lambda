const AWS = require('aws-sdk')
const config = require('./config')
const logger = require('./logger')
const PhoneTokenService = require('phone-token-service')
const stringNormalizer = require('string-normalizer');

async function writeTestAuthorizedRequest(arid, phone, application, isExpired) {
  logger.info('Mock authorized request process starting')
  const phoneTokenService = new PhoneTokenService({
    tokenHashHmac: process.env.USERTOKEN_HASH_HMAC,
    s3bucket: process.env.USERTOKENS_S3_BUCKET || `forgotpw-usertokens-dev`,
    defaultCountryCode: 'US'
  })
  let userToken = await phoneTokenService.getTokenFromPhone(phone)

  let expireEpoch = null
  if (isExpired) {
    // make it already expired
    expireEpoch = (new Date).getTime() - 1000
  } else {
    expireEpoch = (new Date).getTime() + (1000 * 60 * 15)
  }
  expireEpoch = Math.round(expireEpoch / 1000)

  let s3key = `arid/${arid}`;
  logger.info(`Storing mocked arid ${arid} to s3://${config.AUTHREQ_S3_BUCKET}/${s3key}`)

  let aridData = {
    expireEpoch,
    userToken,
    rawApplication: application,
    normalizedApplication: stringNormalizer.normalizeString(application)
  }
  logger.debug(`AridData: \n${JSON.stringify(aridData)}`)

  try {
    const s3 = new AWS.S3();
    const data = await s3.putObject({
      Bucket: config.AUTHREQ_S3_BUCKET,
      Key: s3key,
      Body: JSON.stringify(aridData)
    }).promise()
  }
  catch (err) {
    logger.error(err)
    logger.error(`Error writing to s3://${config.AUTHREQ_S3_BUCKET}/${s3key}:`, err)
    throw err
  }
  logger.debug(`Successfully wrote s3://${config.AUTHREQ_S3_BUCKET}/${s3key}`)

  const result = `${arid} ${isExpired ? 'invalid' : 'valid'} for phone: ${phone} token: ${userToken}`
  logger.info(`Mock result: ${result}`)
  return result
}

module.exports = writeTestAuthorizedRequest

require('make-runnable')
