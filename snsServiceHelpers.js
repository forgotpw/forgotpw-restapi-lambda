const logger = require('./logger')
const config = require('./config')
const AWS = require('aws-sdk');
AWS.config.update({region: config.AWS_REGION});

async function getAwsAccountId() {
  const sts = new AWS.STS();
  const params = {};
  let data = await sts.getCallerIdentity(params).promise()
  return data.Account
}

module.exports.publishToSns = async function (message, snsTopicName) {
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
    logger.error(`Error posting to SNS topic ${snsTopicName}: `, err, err.stack)
    throw err
  }
}

module.exports.normalizePhone = function(rawPhone) {
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

module.exports.normalizeApplication = function(application) {
  try {
    application = application.trim()
    application = application.toLowerCase()
    // replace spaces with dashes
    application = application.replace(/\s+/g, '-')
    // remove non alphanumeric characters
    application = application.replace(/\W/g, '')
    // make sure there are no double dashes
    application = application.replace(/--/g, "-")
  }
  catch (err) {
    logger.error(`Error normalizing application string ${application}:`, err)
  }
  return application
}

module.exports.safeTrim = function (s) {
  try {
    return s.trim()
  }
  catch (err) {
    logger.warn('Error in safeTrim: ', err)
    return s
  }
}
