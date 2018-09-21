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
      logger.debug('dynamoResponse: ', dynamoResponse)
    }
    catch (err) {
      logger.warn(`Unable to read confirmation code from Dynamodb for ${normalizedPhone}, err: `, err)
      await incrementInvalidRequestCounter(normalizedPhone)
      return false
    }

    if (Object.keys(dynamoResponse).length === 0) {
      logger.warn(`No code found in database for ${normalizedPhone}`)
      await incrementInvalidRequestCounter(normalizedPhone)
      return false
    }

    // ensure the invalid count is not beyond the max allowed
    if (dynamoResponse.Item.InvalidCount > config.CODE_INVALIDCOUNT_MAX) {
      logger.warn(`Max invalid count exceeded for ${normalizedPhone}`)
      return false
    }

    // ensure the code presented matches the code in the database
    if (dynamoResponse.Item.Code != code) {
      logger.warn(`Presented code ${code} does not match code in database ${dynamoResponse.Item.Code}`)
      await incrementInvalidRequestCounter(normalizedPhone)
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

async function incrementInvalidRequestCounter(normalizedPhone) {
  const docClient = new AWS.DynamoDB.DocumentClient()

  const params = {
      TableName:'fpw_confirmation_code',
      Key: { 'NormalizedPhone': normalizedPhone },
      UpdateExpression: 'ADD #invalidcount :incr',
      ExpressionAttributeNames: {'#invalidcount' : 'InvalidCount'},
      ExpressionAttributeValues: {
        ':incr' : 1,
      },
      ReturnValues: 'UPDATED_NEW'
  };

  logger.debug(`Incrementing invalid count for ${normalizedPhone}...`)
  let data = null
  try {
    data = await docClient.update(params).promise()
  }
  catch (err) {
    logger.error("Unable to update InvalidCount in Dynamodb: ", JSON.stringify(err, null, 2))
    throw err
  }
  logger.info(`Updated InvalidCount to ${data.Attributes.InvalidCount} for ${normalizedPhone}`)
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
