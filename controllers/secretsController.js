const PhoneTokenService = require('phone-token-service')
const SecretsApiService = require('../lib/secretsApiService')
const SecretAutogenService = require('../lib/secretAutogenService')
const VerificationCodesService = require('../lib/verificationCodesService')
const logger = require('../logger')
const config = require('../config')

const phoneTokenConfig = {
  tokenHashHmac: config.USERTOKEN_HASH_HMAC,
  s3bucket: config.USERTOKENS_S3_BUCKET,
  defaultCountryCode: 'US'
}

module.exports.storeSecret = async function(ctx) {
    const phoneTokenService = new PhoneTokenService(phoneTokenConfig)
    const secretsApiService = new SecretsApiService()
    const userToken = await phoneTokenService.getTokenFromPhone(ctx.request.body.phone)
    const verificationCode = ctx.headers['x-fpw-verificationcode']
    if (!verificationCode) {
      ctx.status = 401
      ctx.body = JSON.stringify({ message: 'Verification code is missing in header' })
    }
    const verificationCodesService = new VerificationCodesService()
    let valid = await verificationCodesService.validateCode(
      verificationCode,
      userToken)
    if (!valid) {
      let msg = 'Verification code presented is not valid or is expired'
      logger.warn(msg)
      ctx.status = 401
      ctx.body = JSON.stringify({ message: msg })
    } else {
      await secretsApiService.publishStoreEvent(
        ctx.request.body.secret,
        ctx.request.body.application,
        userToken)
      ctx.status = 200
      ctx.body = JSON.stringify({ message: 'Successfully posted store secret event' })
    }
}

module.exports.retrieveSecret = async function(ctx) {
    const phoneTokenService = new PhoneTokenService(phoneTokenConfig)
    const secretsApiService = new SecretsApiService()
    const userToken = await phoneTokenService.getTokenFromPhone(ctx.request.body.phone)
    await secretsApiService.publishRetrieveEvent(
        ctx.request.body.application,
        userToken)
    ctx.status = 200
    ctx.body = JSON.stringify({ message: 'Successfully posted retrieve secret event' })
}

module.exports.autogenSecret = async function(ctx) {
  const secretAutogenService = new SecretAutogenService()
  const autogenSecret = await secretAutogenService.generate(
    ctx.request.body.languageCode,
    config.AUTOGEN_PW_NUMWORDS,
    config.AUTOGEN_PW_MAXCHARSPERWORD)
  ctx.status = 200
  ctx.body = JSON.stringify({ autogenSecret })
}
