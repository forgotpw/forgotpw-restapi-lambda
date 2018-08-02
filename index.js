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

  let response
  switch (path) {
    case 'hints':
      response = await hintsController(event, done)
      break
    default:
      response = errorResponse(400,
        `Unhandled path requested: ${path}`
        )
      break
  }

  done(null, response)
}

async function hintsController(event) {
  const pwhintApiService = new PwhintApiService()

  switch (event.method) {
    case 'PUT':
      try {
        await pwhintApiService.publishStoreEvent(
          event.body.hint,
          event.body.application,
          event.body.phone
        )
      }
      catch (err) {
        if (err.message.indexOf('Error validating message') > -1)
          return errorResponse(400, err)
        else 
          return errorResponse(500, err)
      }
      let response = {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully posted event`
        })
      }
      return response
      break
    default:
      return errorResponse(405,
        `Unhandled API request method: ${event.method}`
        )
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