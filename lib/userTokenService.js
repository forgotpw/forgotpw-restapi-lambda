const config = require('../config')
const AWS = require('aws-sdk');
AWS.config.update({region: config.AWS_REGION});
const logger = require('../logger')
const libphonenumber = require('libphonenumber-js')
const crypto = require('crypto');

class UserTokenService {
  constructor() {}

  async getUserTokenFromRawPhone(rawPhone, defaultCountryCode) {
    const userTokenService = new UserTokenService()
    if (!defaultCountryCode) {
      defaultCountryCode = 'US'
    }
    const e164 = userTokenService.convertPhoneToE164Format(rawPhone, defaultCountryCode)
    let userToken = await userTokenService.lookupUserToken(e164)
    if (userToken != null) {
      logger.debug(`Retrieved existing user token from raw phone: ${userToken}`)
    } else {
      userToken = userTokenService.createUserToken(rawPhone)
      logger.debug(`Created new user token from raw phone: ${userToken}`)
    }
    return userToken
  }

  // for defaultCountryCode, have the front end make an ajax call
  // to https://ipapi.co/country/ to return the country code
  convertPhoneToE164Format(rawPhone, defaultCountryCode) {
    try {
      if (!defaultCountryCode) {
        defaultCountryCode = 'US'
      }
      const phoneNumber = libphonenumber.parsePhoneNumber(rawPhone, defaultCountryCode)
      return phoneNumber.number
    } catch (err) {
      let msg = `Error converting '${rawPhone}' to E164 format: ${err}`
      logger.error(msg)
      throw new Error(msg)
    }
  }

  createUserToken(rawPhone) {
    const e164 = this.convertPhoneToE164Format(rawPhone.trim())
    const secret = config.USERTOKEN_HASH_HMAC
    const hash = crypto.createHmac('sha256', secret)
                      .update(e164)
                      .digest('hex')
    const userToken = `UT${hash}`
    return userToken
  }

  async storeUserToken(userToken) {
    logger.debug(`Storing token for ${userToken} s3://${config.USERTOKENS_S3_BUCKET}/(key masked)`)
    await putS3userToken(`tokens/${userToken}`, e164)
    logger.debug(`Storing e164 for ${userToken} s3://${config.USERTOKENS_S3_BUCKET}/(key masked)`)
    await putS3userToken(`e164/${e164}`, userToken)
  }

  async userTokenExists(userToken) {
    let contentLength = null
    const s3key = `tokens/${userToken}`
    try {
      const s3 = new AWS.S3()
      let resp = await s3.headObject({
        Bucket: config.USERTOKENS_S3_BUCKET,
        Key: s3key
      }).promise()
      contentLength = resp.ContentLength
    }
    catch (err) {
      logger.error(`Error checking for existance of user token at s3://${config.USERTOKENS_S3_BUCKET}/${s3key}:`, err)
      throw err
    }
    logger.debug(`Found existing user token at s3://${config.USERTOKENS_S3_BUCKET}/${s3key}`)
    return contentLength > 0 ? true : false
  }

  async lookupUserToken(e164) {
    let data = null
    const s3key = `e164/${e164}`
    try {
      const s3 = new AWS.S3()
      data = await s3.getObject({
        Bucket: config.USERTOKENS_S3_BUCKET,
        Key: s3key
      }).promise()
    }
    catch (err) {
      if (err.code == 'NoSuchKey') {
        return null
      } else {
        let msg = `Error reading user token at s3://${config.USERTOKENS_S3_BUCKET}/${s3key}: ${err}`
        logger.error(msg)
        throw err
      }
    }
    logger.debug(`Successfully retrieved user token from e164`)
    return data.Body.toString()
  }

  async lookupUserE164(userToken) {
    let data = null
    const s3key = `tokens/${userToken}`
    try {
      const s3 = new AWS.S3()
      data = await s3.getObject({
        Bucket: config.USERTOKENS_S3_BUCKET,
        Key: s3key
      }).promise()
    }
    catch (err) {
      logger.error(`Error reading user token at s3://${config.USERTOKENS_S3_BUCKET}/${s3key}:`, err)
      throw err
    }
    logger.debug(`Retrieved user token at s3://${config.USERTOKENS_S3_BUCKET}/${s3key}`)
    return data.Body.toString()
  }
}

async function putS3userToken(s3key, body) {
  // no logging here, don't want to leave PII trace in logs
  try {
    const s3 = new AWS.S3()
    let resp = await s3.putObject({
      Bucket: config.USERTOKENS_S3_BUCKET,
      Key: s3key,
      ServerSideEncryption: 'AES256',
      Body: body,
      ContentType: 'text/plain'
    }).promise()
  }
  catch (err) {
    logger.error(`Error updating s3://${config.USERTOKENS_S3_BUCKET}/(key masked):`, err)
    throw err
  }
  logger.info(`Successfully updated ${body.length} chars to s3://${config.USERTOKENS_S3_BUCKET}/(key masked)`)
}

module.exports = UserTokenService
