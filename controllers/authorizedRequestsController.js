const config = require('../config')
const logger = require('../logger')
const SecretsApiService = require('../lib/secretsApiService')

module.exports.getAuthorizedRequest = async function(ctx) {
    const arid = ctx.request.params.arid
    logger.debug(`Requesting arid: ${arid}`)
    const secretsApiService = new SecretsApiService()
    try {
        const aridData = await secretsApiService.getAuthorizedRequest(arid)
        const adjAridData = {
            rawApplication: aridData.rawApplication,
            normalizedApplication: aridData.normalizedApplication
        }
        ctx.status = 200
        ctx.body = JSON.stringify(adjAridData)
    }
    catch (err) {
        if (err.toString().includes('AridNotFound')) {
            ctx.body = JSON.stringify({ message: `Arid '${arid}' is not found (may be long expired)` })
            ctx.status = 404
        } else if (err.toString().includes('AridExpired')) {
            ctx.body = JSON.stringify({ message: `Arid ${arid} is expired` })
            ctx.status = 403
        } else {
            logger.error(`Unexpected error from SecretsApiService: ${err}`)
            ctx.status = 500
        }
    }
}

module.exports.storeSecret = async function(ctx) {
    const arid = ctx.request.params.arid
    logger.debug(`Request to store secret for arid: ${arid}`)
    const secretsApiService = new SecretsApiService()
    try {
        await secretsApiService.publishStoreEventFromArid(
            ctx.request.body.secret,
            arid)
        ctx.status = 200
        ctx.body = JSON.stringify({ message: 'OK' })
    }
    catch (err) {
        if (err.toString().includes('AridNotFound')) {
            ctx.body = JSON.stringify({ message: `Arid '${arid}' is not found (may be long expired)` })
            ctx.status = 404
        } else if (err.toString().includes('AridExpired')) {
            ctx.body = JSON.stringify({ message: `Arid ${arid} is expired` })
            ctx.status = 403
        } else {
            logger.error(`Unexpected error from SecretsApiService: ${err}`)
            ctx.status = 500
        }
    }
}

module.exports.retrieveSecret = async function(ctx) {
    const arid = ctx.request.params.arid
    logger.debug(`Request to retrieve secret for arid: ${arid}`)
    const secretsApiService = new SecretsApiService()
    try {
        await secretsApiService.publishRetrieveEventFromArid(arid)
        ctx.status = 200
        ctx.body = JSON.stringify({ message: 'OK' })
    }
    catch (err) {
        if (err.toString().includes('AridNotFound')) {
            ctx.body = JSON.stringify({ message: `Arid '${arid}' is not found (may be long expired)` })
            ctx.status = 404
        } else if (err.toString().includes('AridExpired')) {
            ctx.body = JSON.stringify({ message: `Arid ${arid} is expired` })
            ctx.status = 403
        } else {
            logger.error(`Unexpected error from SecretsApiService: ${err}`)
            ctx.status = 500
        }
    }
}
