const config = require('../config')
const AWS = require('aws-sdk');
AWS.config.update({region: config.AWS_REGION});
const logger = require('../logger')
const Joi = require('joi');

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
        hint: safeTrim(hint),
        application: safeTrim(application),
        rawPhone: safeTrim(phone),
        normalizedPhone: normalizePhone(phone)
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
      await publishToSns(JSON.stringify(message), config.STORE_SNS_TOPIC_NAME)
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
        application: safeTrim(application),
        rawPhone: safeTrim(phone),
        normalizedPhone: normalizePhone(phone)
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
      await publishToSns(JSON.stringify(message), config.RETRIEVE_SNS_TOPIC_NAME)
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
    application: Joi.string().min(2).max(256).required(),
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
    application: Joi.string().min(2).max(256).required(),
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

async function getAwsAccountId() {
  const sts = new AWS.STS();
  const params = {};
  let data = await sts.getCallerIdentity(params).promise()
  return data.Account
}

async function publishToSns(message, snsTopicName) {
  const awsAccountId = await getAwsAccountId()
  const arn = `arn:aws:sns:${config.AWS_REGION}:${awsAccountId}:${snsTopicName.trim()}`
  let params = {
    Message: message,
    TopicArn: arn
  };

  const sns = new AWS.SNS({apiVersion: '2010-03-31'})
  try {
    logger.debug(`Posting to SNS topic ${params.TopicArn}`);
    let data = await sns.publish(params).promise()
    logger.info("Posted to SNS, MessageID is " + data.MessageId);
  }
  catch (err) {
    logger.error('Error posting to SNS topic: ', err, err.stack)
    throw err
  }
}

function normalizePhone(rawPhone) {
  try {
    return rawPhone
    // remove all non numeric characters
    .replace(/\D/g,'')
    // remove all whitespace
    .trim()
  }
  catch (err) {
    logger.error('Error normalizing phone number: ', err)
    return rawPhone
  }
}

function safeTrim(s) {
  try {
    return s.trim()
  }
  catch (err) {
    logger.warn('Error in safeTrim: ', err)
    return s
  }
}

module.exports = SecretsApiService
