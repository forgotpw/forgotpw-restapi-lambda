const router = require('koa-joi-router');
const route = router()
const Joi = router.Joi;
const logger = require('../logger')
const secretsController = require('../controllers/secretsController');

route
  .route({
    method: 'post',
    path: '/secrets/autogen',
    validate: {
      body: {
        languageCode: Joi.string().min(2).max(5).required()
      },
      type: 'json',
    },
    handler: async (ctx) => {
      try {
        await secretsController.autogenSecret(ctx)
      } catch (e) {
        logger.error(e)
        ctx.status = 500;
      }
    }
  })


route.prefix('/v1')

module.exports = route
