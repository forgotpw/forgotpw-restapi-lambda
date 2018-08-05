const config = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  STORE_SNS_TOPIC_NAME: process.env.STORE_SNS_TOPIC_NAME,
  RETRIEVE_SNS_TOPIC_NAME: process.env.RETRIEVE_SNS_TOPIC_NAME,
  LOG_LEVEL: process.env.LOG_LEVEL
}

module.exports = config
