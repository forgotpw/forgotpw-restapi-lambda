'use strict';

require("dotenv").config({ path: ".env" })
let VERBOSE = (process.env.VERBOSE == 'true') || false

async function publishPwhintStoreEvent(event, context, done) {
  let response = {}
  try {
    if (!process.env.SNS_TOPIC_ARN) {
      throw new Error('SNS_TOPIC_ARN environment variable missing!')
    }

    let payload = JSON.parse(event.body)
    const message = {
      action: 'store',
      hint: safeTrim(payload.hint),
      application: safeTrim(payload.application),
      rawPhone: safeTrim(payload.phone),
      normalizedPhone: normalizePhone(payload.phone)
    }
  
    // don't let the pw hints slip out in the logs
    let obfuscatedMessage = message
    obfuscatedMessage.hint = `(removed ${message.hint.length} chars)`
    VERBOSE && console.debug('Message:\n', obfuscatedMessage)
  
    await publishToSns(JSON.stringify(message), process.env.SNS_TOPIC_ARN)
    response = {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully posted to topic: ${process.env.SNS_TOPIC_ARN}`,
        input: event,
      })
    }
  }
  catch (err) {
    response = {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error: ${err}`,
        input: event,
      })
    }
  }

  done(null, response);
};

async function publishToSns(message, snsTopicArn) {
  const AWS = require('aws-sdk');
  AWS.config.update({region: process.env.AWS_REGION});

  let params = {
    Message: message,
    TopicArn: process.env.SNS_TOPIC_ARN
  };

  const sns = new AWS.SNS({apiVersion: '2010-03-31'})
  try {
    VERBOSE && console.debug(`Posting to SNS topic ${params.TopicArn}`);
    let data = await sns.publish(params).promise()
    console.log("Posted to SNS, MessageID is " + data.MessageId);
  }
  catch (err) {
    console.error('Error posting to SNS topic: ', err, err.stack)
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
    console.error('Error normalizing phone number: ', err)
    return rawPhone
  }
}

function safeTrim(s) {
  try {
    return s.trim()
  }
  catch (err) {
    VERBOSE && console.warn('Error in safeTrim: ', err)
    return s
  }
}

module.exports.publishPwhintStoreEvent = publishPwhintStoreEvent
