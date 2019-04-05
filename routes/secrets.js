const router = require('koa-joi-router');
const route = router()
const Joi = router.Joi;
const logger = require('../logger')
const secretsController = require('../controllers/secretsController');

route
  .route({
    method: 'put',
    path: '/secrets',
    validate: {
      body: {
        application: Joi.string().min(2).max(256).required(),
        secret: Joi.string().min(3).max(256).required(),
        phone: Joi.string().min(10).max(32).required()
      },
      // absense of x-fpw-verificationcode should yield 401 not 400
      // header: Joi.object({
      //   'x-fpw-verificationcode': Joi.string().required().min(4).max(10)
      // }).options({
      //   allowUnknown: true
      // }),
      type: 'json',
    },
    handler: async (ctx) => {
      try {
        await secretsController.storeSecret(ctx)
      } catch (e) {
        logger.error(e)
        ctx.status = 500;
      }
    }
  })
  .route({
    method: 'post',
    path: '/secrets',
    validate: {
      body: {
        application: Joi.string().min(2).max(256).required(),
        phone: Joi.string().min(10).max(32).required()
      },
      type: 'json',
    },
    handler: async (ctx) => {
      try {
        await secretsController.retrieveSecret(ctx)
      } catch (e) {
        logger.error(e)
        ctx.status = 500;
      }
    }
  })

route.prefix('/v1')

module.exports = route
