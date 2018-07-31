const config = require('../config')
const AWS = require('aws-sdk');
AWS.config.update({region: config.AWS_REGION});
const logger = require('../logger')

class PwhintApiService {
  constructor() {}

  async publishStoreEvent(hint, application, phone) {
    let response = {}, message = {}
    try {
      if (!config.SNS_TOPIC_NAME) {
        throw new Error('SNS_TOPIC_NAME environment variable missing!')
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
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `Error building message: ${err}`
        })
      }
    }
  
    try {
      validateMessage(message)
      logger.info('Message validated OK')
    }
    catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error validating message: ${err}`
        })
      }
    }
  
    try {
      await publishToSns(JSON.stringify(message), config.SNS_TOPIC_NAME)
      response = {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully posted to topic: ${config.SNS_TOPIC_NAME}`
        })
      }
    }
    catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `Error publishing message: ${err}`
        })
      }
    }
  
    return response
  }


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

function validateMessage(message) {

  // TODO do real validation with Joi

  // NOTE: do not log message values here, raw hint/message passed in

  if (!message.hint || message.hint.length <= 0) {
    throw new Error("Message hint not supplied")
  }
}

module.exports = PwhintApiService
