const AWS = require("aws-sdk")
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

  async validateCode(code, phone) {
    const normalizedPhone = helpers.normalizePhone(phone)
    const docClient = new AWS.DynamoDB.DocumentClient()
    const params = {
      TableName : 'fpw_confirmation_code',
      Key: {
        NormalizedPhone: normalizedPhone
      }
    };
    logger.debug(`Trying to retrieve confirmation code ${code} from Dynamodb for ${normalizedPhone}...`)
    let dynamoResponse = null
    try {
      dynamoResponse = await docClient.get(params).promise()
    }
    catch (err) {
      // logger.error("Unable to read confirmation code from Dynamodb: ", JSON.stringify(err, null, 2))
      // throw err
      logger.warn(`No code found in database for ${normalizedPhone}, err: `, err)
      return false
    }

    // ensure the code presented matches the code in the database
    if (dynamoResponse.Item.Code != code) {
      logger.warn(`Presented code ${code} does not match code in database ${dynamoResponse.Item.Code}`)
      return false
    }
    
    // ensure the code is not expired
    const currentEpochTime = Math.round((new Date).getTime() / 1000)
    if (currentEpochTime > dynamoResponse.Item.ExpireTime) {
      logger.warn(`Presented code exists in database but is expired (db epoch ${dynamoResponse.Item.ExpireTime} vs current epoch ${currentEpochTime})`)
      return false
    }

    logger.debug(`Confirmation code ${code} is valid for ${normalizedPhone}`)
    return true
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
