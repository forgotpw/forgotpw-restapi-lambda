'use strict';

const serverless = require('serverless-http');
const Koa = require("koa");
const helmet = require("koa-helmet");
const koaLogger = require("koa-logger");
const responseHandler = require('koa-response-handler');
const cors = require('koa2-cors');
const healthRoutes = require("./routes/health");
const secretsRoutes = require("./routes/secrets");
const codesRoutes = require("./routes/codes");
const aridRoutes = require("./routes/authorizedRequests");

const app = new Koa();

app
  .use(koaLogger())
  .use(helmet())
  .use(responseHandler())
  .use(cors())
  .use(healthRoutes.middleware())
  .use(secretsRoutes.middleware())
  .use(codesRoutes.middleware())
  .use(aridRoutes.middleware())

const handler = serverless(app);
module.exports.handler = async (event, context) => {
  return await handler(event, context);
};

// TODO: nuke functionality needs to be relocated to lex handler, does not belong in REST API
// async function nukeController(event) {
//   const phoneTokenConfig = {
//     tokenHashHmac: config.USERTOKEN_HASH_HMAC,
//     s3bucket: config.USERTOKENS_S3_BUCKET,
//     defaultCountryCode: 'US'
//   }  
//   let headers = cleanHeaders(event.headers)
//   const countryCode = headers['x-fpw-countrycode']
//   if (countryCode && countryCode.length == 2) {
//     phoneTokenConfig.defaultCountryCode = countryCode
//   }
//   const phoneTokenService = new PhoneTokenService(phoneTokenConfig)
//   const nukeService = new NukeService()

//   const body = JSON.parse(event.body)
//   const userToken = await phoneTokenService.getTokenFromPhone(body.phone)

//   switch (event.httpMethod) {
//     case 'POST':
//       const verificationCodesService = new VerificationCodesService()
//       let valid = await verificationCodesService.validateCode(
//         body.verificationCode,
//         userToken)
//       if (!valid) {
//         let msg = 'Verification code presented is not valid or is expired'
//         logger.warn(msg)
//         return gatewayResponse(401, msg)
//       }
//       await nukeService.publishNukeAccountEvent(userToken)
//       return gatewayResponse(200, 'Successfully posted event')
//     default:
//       throw new Error(`Unhandled method requested: ${event.method}`)
//   }
// }

module.exports.handler = handler
