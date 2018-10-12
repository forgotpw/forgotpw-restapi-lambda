const config = require('../config')
const AWS = require('aws-sdk');
AWS.config.update({region: config.AWS_REGION});
const logger = require('../logger')
const Joi = require('joi');
const helpers = require('../snsServiceHelpers')

class SecretsApiService {
  constructor() {}

  async publishStoreEvent(hint, application, phone) {
    let response = {}, message = {}
    try {
      if (!config.STORE_SNS_TOPIC_NAME) {
        throw new Error('STORE_SNS_TOPIC_NAME environment variable missing!')
      }
  
      message = {
        action: 'store',
        hint: helpers.safeTrim(hint),
        rawApplication: helpers.safeTrim(application),
        normalizedApplication: helpers.normalizeApplication(application),
        rawPhone: helpers.safeTrim(phone),
        normalizedPhone: helpers.normalizePhone(phone)
      }
    
      // don't let the pw hints slip out in the logs
      let obfuscatedMessage = JSON.parse(JSON.stringify(message));
      obfuscatedMessage.hint = `(removed ${message.hint.length} chars)`
      logger.debug('Message:\n', obfuscatedMessage)
    }
    catch (err) {
      throw new Error(`Error building message: ${err}`)
    }

    try {
      validateStoreMessage(message)
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

  async publishRetrieveEvent(application, phone) {
    let response = {}, message = {}
    try {
      if (!config.RETRIEVE_SNS_TOPIC_NAME) {
        throw new Error('RETRIEVE_SNS_TOPIC_NAME environment variable missing!')
      }
  
      message = {
        action: 'retrieve',
        rawApplication: helpers.safeTrim(application),
        normalizedApplication: helpers.normalizeApplication(application),
        rawPhone: helpers.safeTrim(phone),
        normalizedPhone: helpers.normalizePhone(phone)
      }
    
    }
    catch (err) {
      throw new Error(`Error building message: ${err}`)
    }

    try {
      validateRetrieveMessage(message)
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

function validateStoreMessage(message) {
  // NOTE: do not log message values here, raw hint/message passed in

  const schema = Joi.object().keys({
    action: Joi.string().valid('store').required(),
    hint: Joi.string().min(3).max(256).required(),
    rawApplication: Joi.string().min(2).max(256).required(),
    normalizedApplication: Joi.string().min(2).max(256).required(),
    rawPhone: Joi.string().min(10).max(32).required(),
    normalizedPhone: Joi.string().min(10).max(32).required()
  })
  const result = Joi.validate(message, schema)
  if (result.error !== null) {
    const msg = "Store message object invalid: " + JSON.stringify(result)
    logger.error(msg)
    throw new Error(msg)
  }

  logger.info('Message validated OK')
}

function validateRetrieveMessage(message) {
  // NOTE: do not log message values here, raw hint/message passed in

  const schema = Joi.object().keys({
    action: Joi.string().valid('retrieve').required(),
    rawApplication: Joi.string().min(2).max(256).required(),
    normalizedApplication: Joi.string().min(2).max(256).required(),
    rawPhone: Joi.string().min(10).max(32).required(),
    normalizedPhone: Joi.string().min(10).max(32).required()
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
