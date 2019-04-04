const PhoneTokenService = require('phone-token-service')
const SecretsApiService = require('../lib/secretsApiService')
const VerificationCodesService = require('../lib/verificationCodesService')
const logger = require('../logger')
const config = require('../config')

module.exports.storeSecret = async function(ctx) {
    logger.debug('Starting store secret')
    const phoneTokenConfig = {
        tokenHashHmac: config.USERTOKEN_HASH_HMAC,
        s3bucket: config.USERTOKENS_S3_BUCKET,
        defaultCountryCode: 'US'
    }
    const phoneTokenService = new PhoneTokenService(phoneTokenConfig)
    const secretsApiService = new SecretsApiService()
    const userToken = await phoneTokenService.getTokenFromPhone(ctx.request.body.phone)
    const verificationCode = ctx.headers['x-fpw-verificationcode']
    const verificationCodesService = new VerificationCodesService()
    let valid = await verificationCodesService.validateCode(
      verificationCode,
      userToken)
    if (!valid) {
      let msg = 'Verification code presented is not valid or is expired'
      logger.warn(msg)
      ctx.status = 401
      ctx.body = msg
    }
    await secretsApiService.publishStoreEvent(
      ctx.request.body.secret,
      ctx.request.body.application,
      userToken)
    ctx.status = 200
    ctx.body = 'Successfully posted event'    
}

async function retrieveSecret(ctx) {
    const phoneTokenService = new PhoneTokenService(phoneTokenConfig)
    const secretsApiService = new SecretsApiService()
    const userToken = await phoneTokenService.getTokenFromPhone(ctx.request.body.phone)
    await secretsApiService.publishRetrieveEvent(
        ctx.request.body.application,
        userToken)
}
