const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
const wrapped = mochaPlugin.getWrapper('fpw-restapi', '/index.js', 'handler');
const AWS = require('aws-sdk')
const writeTestVerificationCode = require('../mockVerificationCode')

const validStoreEventData = require('../events/ValidStoreGatewayRequest.json')
const codeMissingStoreEventData = require('../events/CodeMissingStoreGatewayRequest.json')
const invalidStoreEventData = require('../events/InvalidStoreGatewayRequest.json')
const validRetrieveEventData = require('../events/ValidRetrieveGatewayRequest.json')
const invalidRetrieveEventData = require('../events/InvalidRetrieveGatewayRequest.json')
const validSendCodeEventData = require('../events/ValidSendCodeGatewayRequest.json')
const validNukeAccountEventData = require('../events/ValidNukeAccountGatewayRequest.json')

describe('fpw-restapi', () => {
  before((done) => {
    done();
  });

  it('/v1/secrets PUT (store) returns 200 for valid requests with valid verification code', async () => {
    await writeTestVerificationCode(1234, '6095551313', false)
    return wrapped.run(validStoreEventData).then((response) => {
      expect(response.statusCode).to.equal(200);
    });
  });

  it('/v1/secrets PUT (store) returns 401 for valid requests with missing verification code', async () => {
    await writeTestVerificationCode(1234, '6095551313', false)
    return wrapped.run(codeMissingStoreEventData).then((response) => {
      expect(response.statusCode).to.equal(401);
    });
  });

  it('/v1/secrets PUT (store) returns 401 for valid requests with invalid verification code', async () => {
    await writeTestVerificationCode(9999, '6095551313', false)
    return wrapped.run(validStoreEventData).then((response) => {
      expect(response.statusCode).to.equal(401);
    });
  });

  it('/v1/secrets PUT (store) returns 401 for valid requests with expired verification code', async () => {
    await writeTestVerificationCode(1234, '6095551313', true)
    return wrapped.run(validStoreEventData).then((response) => {
      expect(response.statusCode).to.equal(401);
    });
  });

  it('/v1/secrets POST (retrieve) returns 200 for valid requests', () => {
    return wrapped.run(validRetrieveEventData).then((response) => {
      expect(response.statusCode).to.equal(200);
    });
  });

  it('/v1/secrets POST (retrieve) returns 400 for invalid requests', () => {
    return wrapped.run(invalidRetrieveEventData).then((response) => {
      expect(response.statusCode).to.equal(400);
    });
  });

  it('/v1/codes POST (send) returns 200 for valid requests', () => {
    return wrapped.run(validSendCodeEventData).then((response) => {
      expect(response.statusCode).to.equal(200);
    });
  });

  it('/v1/nuke POST (send) returns 200 for valid requests', async () => {
    await writeTestVerificationCode(1234, '6095551414', false)
    return wrapped.run(validNukeAccountEventData).then((response) => {
      expect(response.statusCode).to.equal(200);
    });
  });

  it('/v1/nuke POST (send) returns 401 for valid requests with invalid verification code', async () => {
    await writeTestVerificationCode(1234, '6095551414', true)
    return wrapped.run(validNukeAccountEventData).then((response) => {
      expect(response.statusCode).to.equal(401);
    });
  });

});
