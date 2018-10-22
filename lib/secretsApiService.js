const config = require('../config')
const AWS = require('aws-sdk');
const logger = require('../logger')
const Joi = require('joi');
const PhoneTokenService = require('phone-token-service')
const helpers = require('./snsServiceHelpers')

AWS.config.update({region: config.AWS_REGION});

class SecretsApiService {
  constructor() {}

  async publishStoreEvent(secret, application, phone, defaultCountryCode) {
    const phoneTokenService = new PhoneTokenService({
      tokenHashHmac: config.USERTOKEN_HASH_HMAC,
      s3bucket: config.USERTOKENS_S3_BUCKET,
      defaultCountryCode: 'US'
    })
    const userToken = await phoneTokenService.getTokenFromPhone(phone)
    logger.info(`Publishing store secret event for user ${userToken}`)

    let response = {}, message = {}
    try {
      if (!config.STORE_SNS_TOPIC_NAME) {
        throw new Error('STORE_SNS_TOPIC_NAME environment variable missing!')
      }

      message = {
        action: 'store',
        secret: helpers.safeTrim(secret),
        rawApplication: helpers.safeTrim(application),
        normalizedApplication: helpers.normalizeApplication(application),
        userToken: userToken
      }
    
      // don't let the pw hints slip out in the logs
      let obfuscatedMessage = JSON.parse(JSON.stringify(message));
      obfuscatedMessage.secret = `(removed ${message.secret.length} chars)`
      logger.debug('Message:\n', obfuscatedMessage)
    }
    catch (err) {
      throw new Error(`Error building message: ${err}`)
    }

    try {
      validateStoreSNSMessage(message)
    }
    catch (err) {
      throw new Error(`Error validating message: ` + err)
    }
    
    try {
      await helpers.publishToSns(JSON.stringify(message), config.STORE_SNS_TOPIC_NAME)
    }
    catch (err) {
      throw new Error(`Error publishing message: ${err}`)
    }
  
    return response
  }

  async publishRetrieveEvent(application, phone, defaultCountryCode) {
    const phoneTokenService = new PhoneTokenService({
      tokenHashHmac: config.USERTOKEN_HASH_HMAC,
      s3bucket: config.USERTOKENS_S3_BUCKET,
      defaultCountryCode: 'US'
    })
    const userToken = await phoneTokenService.getTokenFromPhone(phone)
    logger.info(`Publishing retrieve secret event for user ${userToken}`)

    let response = {}, message = {}
    try {
      if (!config.RETRIEVE_SNS_TOPIC_NAME) {
        throw new Error('RETRIEVE_SNS_TOPIC_NAME environment variable missing!')
      }

      message = {
        action: 'retrieve',
        rawApplication: helpers.safeTrim(application),
        normalizedApplication: helpers.normalizeApplication(application),
        userToken: userToken
      }
    
    }
    catch (err) {
      throw new Error(`Error building message: ${err}`)
    }

    try {
      validateRetrieveSNSMessage(message)
    }
    catch (err) {
      throw new Error(`Error validating message: ` + err)
    }
    
    try {
      await helpers.publishToSns(JSON.stringify(message), config.RETRIEVE_SNS_TOPIC_NAME)
    }
    catch (err) {
      throw new Error(`Error publishing message: ${err}`)
    }
  
    return response
  }
}

function validateStoreSNSMessage(message) {
  // NOTE: do not log message values here, raw secret/message passed in
  const schema = Joi.object().keys({
    action: Joi.string().valid('store').required(),
    secret: Joi.string().min(3).max(256).required(),
    rawApplication: Joi.string().min(2).max(256).required(),
    normalizedApplication: Joi.string().min(2).max(256).required(),
    userToken: Joi.string().min(20).max(100).required()
  })
  const result = Joi.validate(message, schema)
  if (result.error !== null) {
    const msg = "Store message object invalid: " + JSON.stringify(result)
    logger.error(msg)
    throw new Error(msg)
  }
  logger.info('Message validated OK')
}

function validateRetrieveSNSMessage(message) {
  const schema = Joi.object().keys({
    action: Joi.string().valid('retrieve').required(),
    rawApplication: Joi.string().min(2).max(256).required(),
    normalizedApplication: Joi.string().min(2).max(256).required(),
    userToken: Joi.string().min(20).max(100).required()
  })
  const result = Joi.validate(message, schema)
  if (result.error !== null) {
    const msg = "Retrieve message object invalid: " + JSON.stringify(result)
    logger.error(msg)
    throw new Error(msg)
  }
  logger.info('Message validated OK')
}

module.exports = SecretsApiService
