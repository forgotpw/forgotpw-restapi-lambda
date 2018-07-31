const config = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  SNS_TOPIC_NAME: process.env.SNS_TOPIC_NAME,
  VERBOSE: process.env.VERBOSE
}

module.exports = config
