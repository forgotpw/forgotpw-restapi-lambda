const config = require('../config')
const logger = require('../logger')
const SecretsApiService = require('../lib/secretsApiService')

module.exports.getAuthorizedRequest = async function(ctx) {
    const arid = ctx.request.params.arid
    logger.debug(`Requesting arid: ${arid}`)
    const secretsApiService = new SecretsApiService()
    try {
        const aridData = await secretsApiService.getAuthorizedRequest()
        const adjAridData = {
            rawApplication: aridData.rawApplication,
            normalizedApplication: aridData.normalizedApplication
        }
        ctx.status = 200
        ctx.body = JSON.stringify(adjAridData)
    }
    catch (err) {
        if (err.toString().includes('AridNotFound')) {
            ctx.body = `Arid '${arid}' is not found (may be long expired)`
            ctx.status = 404
        } else if (err.toString().includes('AridExpired')) {
            ctx.body = `Arid ${arid} is expired`
            ctx.status = 403
        }  
    }
}
