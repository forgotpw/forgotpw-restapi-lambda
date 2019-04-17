const router = require('koa-joi-router');
const route = router()
const Joi = router.Joi;
const logger = require('../logger')
const authorizedRequestsController = require('../controllers/authorizedRequestsController');
const secretsController = require('../controllers/secretsController');

route
  .route({
    method: 'get',
    path: '/authorizedRequests/:arid',
    handler: async (ctx) => {
      try {
        await authorizedRequestsController.getAuthorizedRequest(ctx)
      } catch (e) {
        logger.error(e)
        ctx.status = 500
      }
    }
  })
  .route({
    method: 'get',
    path: '/authorizedRequests/:arid/secret',
    output: {
      200: {
        body: {
          secret: Joi.string()
        }
      }
    },
    handler: async (ctx) => {
      try {
        await authorizedRequestsController.retrieveSecret(ctx)
      } catch (e) {
        logger.error(e)
        ctx.status = 500
      }
    }
  })
  .route({
    method: 'put',
    path: '/authorizedRequests/:arid',
    validate: {
      body: {
        secret: Joi.string().min(3).max(256).required()
      },
      type: 'json',
    },
    handler: async (ctx) => {
      try {
        await authorizedRequestsController.storeSecret(ctx)
      } catch (e) {
        logger.error(e)
        ctx.status = 500;
      }
    }
  })

route.prefix('/v1')

module.exports = route
