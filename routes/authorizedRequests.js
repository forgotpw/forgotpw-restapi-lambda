const router = require('koa-joi-router');
const route = router()
const Joi = router.Joi;
const logger = require('../logger')
const authorizedRequestsController = require('../controllers/authorizedRequestsController');

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

route.prefix('/v1')

module.exports = route
