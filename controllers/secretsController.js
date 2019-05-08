const SecretAutogenService = require('../lib/secretAutogenService')
const logger = require('../logger')
const config = require('../config')

module.exports.autogenSecret = async function(ctx) {
  const secretAutogenService = new SecretAutogenService()
  const autogenSecret = await secretAutogenService.generate(
    ctx.request.body.languageCode,
    config.AUTOGEN_PW_NUMWORDS,
    config.AUTOGEN_PW_MAXCHARSPERWORD)
  ctx.status = 200
  ctx.body = JSON.stringify({ autogenSecret })
}
