'use strict';

const PwhintApiService = require('./pwhintApiService/pwhintApiService')
const logger = require('./logger')

async function handler(event, context, done) {

  logger.trace('Received event:', JSON.stringify(event))

  let path = ''
  try {
    path = parsePath(event)
  }
  catch (err) {
    const msg = 'Error parsing path: ' + err
    logger.error(msg)
    return done(null, errorResponse(500, msg))
  }

  switch (path) {
    case 'hints':
      hintsController(event, done)
      break
    default:
      done(null, errorResponse(400,
        `Unhandled path requested: ${path}`
        ))
      break
  }
}

async function hintsController(event, done) {
  const pwhintApiService = new PwhintApiService()

  switch (event.method) {
    case 'PUT':
      let response = await pwhintApiService.publishStoreEvent(
        event.body.hint,
        event.body.application,
        event.body.phone
      )
      done(null, response)
      break
    default:
      done(null, errorResponse(405,
        `Unhandled API request method: ${event.method}`
        ))
      break
  }
}

function errorResponse(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: message
    })
  }
}

function parsePath(event) {
  let path = ''
  logger.trace('event.path.proxy: ', event.path.proxy)
  path = event.path.proxy.trim().toLowerCase()

  if (!path || path.length <= 0) {
    throw new Error('Path is unspecified')
  }
  return path
}

module.exports.handler = handler
