const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
const wrapped = mochaPlugin.getWrapper('fpw-restapi', '/index.js', 'handler');
const writeTestAuthorizedRequest = require('../mockAuthorizedRequest')

const validGetAuthorizedRequest = require('../events/ValidGetAuthorizedRequest.json')
const validStoreAridRequest = require('../events/ValidStoreAridRequest.json')
const validRetrieveAridSecretRequest = require('../events/ValidRetrieveAridSecretRequest.json')

describe('fpw-restapi', () => {
  before((done) => {
    done();
  });

  it('/v1/authorizedRequests GET returns 200 for valid requests', async () => {
    const arid = 'abc123'
    const path = `/v1/authorizedRequests/${arid}`
    validGetAuthorizedRequest.path = path
    await writeTestAuthorizedRequest(arid, '6095551212', 'testapp', false)
    return wrapped.run(validGetAuthorizedRequest).then((response) => {
      expect(response.statusCode).to.equal(200);
    });
  });

  it('/v1/authorizedRequests GET returns 404 for non-existant arid', async () => {
    const arid = 'notGoingToBeFound'
    const path = `/v1/authorizedRequests/${arid}`
    validGetAuthorizedRequest.path = path
    return wrapped.run(validGetAuthorizedRequest).then((response) => {
      expect(response.statusCode).to.equal(404);
    });
  });

  it('/v1/authorizedRequests GET returns 403 for expired arid', async () => {
    const arid = 'expired123'
    const path = `/v1/authorizedRequests/${arid}`
    validGetAuthorizedRequest.path = path
    await writeTestAuthorizedRequest(arid, '6095551212', 'testapp', true)
    return wrapped.run(validGetAuthorizedRequest).then((response) => {
      expect(response.statusCode).to.equal(403);
    });
  });

  it('/v1/authorizedRequests PUT returns 200 for valid store arid requests', async () => {
    const arid = 'abc123'
    const path = `/v1/authorizedRequests/${arid}`
    validGetAuthorizedRequest.path = path
    await writeTestAuthorizedRequest(arid, '6095551212', 'testapp', false)
    return wrapped.run(validStoreAridRequest).then((response) => {
      expect(response.statusCode).to.equal(200);
    });
  });

  it('/v1/authorizedRequests PUT returns 404 for non-existant arid', async () => {
    const arid = 'notGoingToBeFound'
    const path = `/v1/authorizedRequests/${arid}`
    validStoreAridRequest.path = path
    return wrapped.run(validStoreAridRequest).then((response) => {
      expect(response.statusCode).to.equal(404);
    });
  });

  it('/v1/authorizedRequests PUT returns 403 for expired arid', async () => {
    const arid = 'expired123'
    const path = `/v1/authorizedRequests/${arid}`
    validStoreAridRequest.path = path
    await writeTestAuthorizedRequest(arid, '6095551212', 'testapp', true)
    return wrapped.run(validStoreAridRequest).then((response) => {
      expect(response.statusCode).to.equal(403);
    });
  });

  it('/v1/authorizedRequests/:arid/secret GET returns 200 for valid retrieve arid requests', async () => {
    const arid = 'abc123'
    const path = `/v1/authorizedRequests/${arid}/secret`
    validRetrieveAridSecretRequest.path = path
    await writeTestAuthorizedRequest(arid, '6095551212', 'testapp', false)
    return wrapped.run(validRetrieveAridSecretRequest).then((response) => {
      expect(response.statusCode).to.equal(200);
    });
  });

  it('/v1/authorizedRequests:arid/secret GET returns 404 for non-existant arid', async () => {
    const arid = 'notGoingToBeFound'
    const path = `/v1/authorizedRequests/${arid}`
    validRetrieveAridSecretRequest.path = path
    return wrapped.run(validRetrieveAridSecretRequest).then((response) => {
      expect(response.statusCode).to.equal(404);
    });
  });

  it('/v1/authorizedRequests:arid/secret GET returns 403 for expired arid', async () => {
    const arid = 'expired123'
    const path = `/v1/authorizedRequests/${arid}`
    validRetrieveAridSecretRequest.path = path
    await writeTestAuthorizedRequest(arid, '6095551212', 'testapp', true)
    return wrapped.run(validRetrieveAridSecretRequest).then((response) => {
      expect(response.statusCode).to.equal(403);
    });
  });

});
