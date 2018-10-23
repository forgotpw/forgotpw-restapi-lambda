const AWS = require("aws-sdk")
const config = require('../config')
const logger = require('../logger')
const Joi = require('joi');
const helpers = require('./snsServiceHelpers')

AWS.config.update({region: config.AWS_REGION});

class ConfirmationCodesService {
  constructor() {}

  async publishSendCodeEvent(userToken) {
    logger.info(`Publishing send code event for user ${userToken}`)

    let response = {}, message = {}
    try {
      if (!config.SENDCODE_SNS_TOPIC_NAME) {
        throw new Error('SENDCODE_SNS_TOPIC_NAME environment variable missing!')
      }
  
      message = {
        action: 'send',
        userToken: userToken
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

  async validateCode(code, userToken) {
    logger.info(`Validating code for user ${userToken}`)

    const docClient = new AWS.DynamoDB.DocumentClient()
    const params = {
      TableName : 'fpw_confirmation_code',
      Key: {
        UserToken: userToken
      }
    };
    logger.debug(`Trying to retrieve confirmation code from Dynamodb for ${userToken}...`)
    let dynamoResponse = null
    try {
      dynamoResponse = await docClient.get(params).promise()
    }
    catch (err) {
      logger.warn(`Unable to read confirmation code from Dynamodb for ${userToken}, err: `, err)
      await incrementInvalidRequestCounter(userToken)
      return false
    }

    if (Object.keys(dynamoResponse).length === 0) {
      logger.warn(`No code found in database for ${userToken}`)
      await incrementInvalidRequestCounter(userToken)
      return false
    }

    // ensure the invalid count is not beyond the max allowed
    if (dynamoResponse.Item.InvalidCount > config.CODE_INVALIDCOUNT_MAX) {
      logger.warn(`Max invalid count exceeded for ${userToken}`)
      return false
    }

    // ensure the code presented matches the code in the database
    if (dynamoResponse.Item.Code != code) {
      logger.warn(`Presented code ${code} does not match code in database ${dynamoResponse.Item.Code}`)
      await incrementInvalidRequestCounter(userToken)
      return false
    }
    
    // ensure the code is not expired
    const currentEpochTime = Math.round((new Date).getTime() / 1000)
    if (currentEpochTime > dynamoResponse.Item.ExpireTime) {
      logger.warn(`Presented code exists in database but is expired (db epoch ${dynamoResponse.Item.ExpireTime} vs current epoch ${currentEpochTime})`)
      return false
    }

    logger.debug(`Confirmation code ${code} is valid for ${userToken}`)
    return true
  }

}

async function incrementInvalidRequestCounter(userToken) {
  const docClient = new AWS.DynamoDB.DocumentClient()

  const params = {
      TableName:'fpw_confirmation_code',
      Key: { 'UserToken': userToken },
      UpdateExpression: 'ADD #invalidcount :incr',
      ExpressionAttributeNames: {'#invalidcount' : 'InvalidCount'},
      ExpressionAttributeValues: {
        ':incr' : 1,
      },
      ReturnValues: 'UPDATED_NEW'
  };

  logger.debug(`Incrementing invalid count for ${userToken}...`)
  let data = null
  try {
    data = await docClient.update(params).promise()
  }
  catch (err) {
    logger.error("Unable to update InvalidCount in Dynamodb: ", JSON.stringify(err, null, 2))
    throw err
  }
  logger.info(`Updated InvalidCount to ${data.Attributes.InvalidCount} for ${userToken}`)
}

function validateSendCodeMessage(message) {
  const schema = Joi.object().keys({
    action: Joi.string().valid('store').required(),
    application: Joi.string().min(2).max(256).required(),
    userToken: Joi.string().min(20).max(100).required()
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
