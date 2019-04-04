const PhoneTokenService = require('phone-token-service')
const VerificationCodesService = require('../lib/verificationCodesService')
const config = require('../config')

module.exports.sendCode = async function(ctx) {
    const phoneTokenConfig = {
        tokenHashHmac: config.USERTOKEN_HASH_HMAC,
        s3bucket: config.USERTOKENS_S3_BUCKET,
        defaultCountryCode: 'US'
    }
    const phoneTokenService = new PhoneTokenService(phoneTokenConfig)
    const verificationCodesService = new VerificationCodesService()
    const userToken = await phoneTokenService.getTokenFromPhone(ctx.request.body.phone)
    await verificationCodesService.publishSendCodeEvent(userToken)
    ctx.status = 200
}
