const config = require('../config')
const logger = require('../logger')
const Joi = require('joi');
const helpers = require('../snsServiceHelpers')

class ConfirmationCodesService {
  constructor() {}

  async publishSendCodeEvent(application, phone) {
    let response = {}, message = {}
    try {
      if (!config.SENDCODE_SNS_TOPIC_NAME) {
        throw new Error('SENDCODE_SNS_TOPIC_NAME environment variable missing!')
      }
  
      message = {
        action: 'send',
        application: helpers.safeTrim(application),
        rawPhone: helpers.safeTrim(phone),
        normalizedPhone: helpers.normalizePhone(phone)
      }
    
      logger.debug('Message:\n', message)
    }
    catch (err) {
      throw new Error(`Error building message: ${err}`)
    }
    
    try {
      await helpers.publishToSns(JSON.stringify(message), config.SENDCODE_SNS_TOPIC_NAME)
    }
    catch (err) {
      throw new Error(`Error publishing message: ${err}`)
    }
  
    return response
  }

}

function validateSendCodeMessage(message) {
  const schema = Joi.object().keys({
    action: Joi.string().valid('store').required(),
    application: Joi.string().min(2).max(256).required(),
    rawPhone: Joi.string().min(10).max(32).required(),
    normalizedPhone: Joi.string().min(10).max(32).required()
  })
  const result = Joi.validate(message, schema)
  if (result.error !== null) {
    const msg = "Send code message object invalid: " + JSON.stringify(result)
    logger.error(msg)
    throw new Error(msg)
  }

  logger.debug('Message validated OK')
}

module.exports = ConfirmationCodesService
