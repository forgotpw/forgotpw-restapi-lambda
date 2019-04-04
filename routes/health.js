const router = require('koa-joi-router');
const route = router()
const Joi = router.Joi;
const logger = require('../logger')
const config = require('../config.js');

route
  .route({
    method: 'get',
    path: '/up',
    handler: async (ctx) => {
      ctx.status = 200
      ctx.body = { status: 'up' }
    }
  })
  .route({
    method: 'get',
    path: '/health',
    handler: async (ctx) => {
      try {
        ctx.status = 200
        ctx.body = { status: 'healthy' }
      } catch (e) {
        logger.error(e)
        ctx.res.internalServerError();
      }
    }
  })

route.prefix('/v1')

module.exports = route
