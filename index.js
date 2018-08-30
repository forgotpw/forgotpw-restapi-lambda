'use strict';

const SecretsApiService = require('./secretsApiService/secretsApiService')
const logger = require('./logger')

async function handler(event, context, done) {

  // raw console log output easier to copy/paste json from cloudwatch logs
  if (process.env.LOG_LEVEL == 'trace') {
    console.log(JSON.stringify(event))
  }

  let path = ''
  try {
    path = parsePath(event)
  }
  catch (err) {
    const msg = 'Error parsing path: ' + err
    return done(null, errorResponse(err))
  }

  try {
    let response
    switch (path) {
      case '/v1/secrets':
        response = await secretsController(event, done)
        break
      default:
        throw new Error(`Unhandled path requested: ${path}`)
    }
    done(null, response)
  }
  catch (err) {
    done(null, errorResponse(err))
  }
}

async function secretsController(event) {
  const secretsApiService = new SecretsApiService()

  logger.trace(`event.httpMethod: ${event.httpMethod}, event.body: ${event.body}`)
  const body = JSON.parse(event.body)
  switch (event.httpMethod) {
    case 'PUT':
      await secretsApiService.publishStoreEvent(
        body.hint,
        body.application,
        body.phone
      )
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully posted event`
        }),
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    case 'POST':
      await secretsApiService.publishRetrieveEvent(
        body.application,
        body.phone
      )
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully posted event`
        }),
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    default:
      throw new Error(`Unhandled method requested: ${event.method}`)
  }
}

function errorResponse(err) {
  const errMappings = [
    { httpStatus: 400, errStartsWith: 'Error validating message' },
    { httpStatus: 405, errStartsWith: 'Unhandled path requested' },
    { httpStatus: 405, errStartsWith: 'Unhandled method requested' }
  ]
  let statusCode = 500
  // surely there is a more efficient way but ...
  for (let errMapping of errMappings) {
    if (err.message.indexOf(errMapping.errStartsWith) > -1)
      statusCode = errMapping.httpStatus
      break
  }
  logger.error(err)
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: err
    })
  }
}

function parsePath(event) {
  let path = ''
  logger.trace('event.path: ', event.path)
  path = event.path.trim().toLowerCase()

  if (!path || path.length <= 0) {
    throw new Error('Path is unspecified')
  }
  return path
}

module.exports.handler = handler
