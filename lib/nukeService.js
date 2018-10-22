const AWS = require("aws-sdk")
const config = require('../config')
const logger = require('../logger')
const Joi = require('joi');
const helpers = require('./snsServiceHelpers')
const UserTokenService = require('./userTokenService')

class NukeService {
  constructor() {}

  async publishNukeAccountEvent(phone, defaultCountryCode) {
    const userTokenService = new UserTokenService()
    const e164 = userTokenService.convertPhoneToE164Format(phone, defaultCountryCode)
    const userToken = await userTokenService.lookupUserToken(e164)

    let response = {}, message = {}
    try {
      if (!config.NUKEACCOUNT_SNS_TOPIC_NAME) {
        throw new Error('NUKEACCOUNT_SNS_TOPIC_NAME environment variable missing!')
      }
  
      message = {
        action: 'nukeaccount',
        userToken: userToken
      }
    
      logger.debug('Message:\n', message)
    }
    catch (err) {
      throw new Error(`Error building nuke account message: ${err}`)
    }
    
    try {
      await helpers.publishToSns(JSON.stringify(message), config.NUKEACCOUNT_SNS_TOPIC_NAME)
    }
    catch (err) {
      const msg = `Error publishing nuke account message: ${err}`
      logger.error(msg)
      throw new Error(msg)
    }

    logger.info(`Successfully published SNS message to nuke account ${userToken}`)
    return response
  }

}

function validateNukeAccountMessage(message) {
  const schema = Joi.object().keys({
    action: Joi.string().valid('nukeaccount').required(),
    rawPhone: Joi.string().min(10).max(32).required(),
    normalizedPhone: Joi.string().min(10).max(32).required()
  })
  const result = Joi.validate(message, schema)
  if (result.error !== null) {
    const msg = "Nuke account message object invalid: " + JSON.stringify(result)
    logger.error(msg)
    throw new Error(msg)
  }

  logger.debug('Message validated OK')
}

module.exports = NukeService
