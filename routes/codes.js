const router = require('koa-joi-router');
const route = router()
const Joi = router.Joi;
const logger = require('../logger')
const codesController = require('../controllers/codesController');

route
  .route({
    method: 'post',
    path: '/codes',
    validate: {
      body: Joi.object( {
        phone: Joi.string().min(10).max(32).required()
      }).options({
        allowUnknown: true
      }),
      type: 'json',
    },
    handler: async (ctx) => {
      try {
        await codesController.sendCode(ctx)
      } catch (e) {
        logger.error(e)
        ctx.status = 500;
      }
    }
  })

route.prefix('/v1')

module.exports = route
