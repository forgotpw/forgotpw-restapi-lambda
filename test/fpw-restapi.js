const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
const wrapped = mochaPlugin.getWrapper('fpw-restapi', '/index.js', 'handler');
const AWS = require('aws-sdk')
const writeTestVerificationCode = require('../mockVerificationCode')

const validStoreEventData = require('../events/ValidStoreRequest.json')
const codeMissingStoreEventData = require('../events/CodeMissingStoreRequest.json')
const invalidStoreEventData = require('../events/InvalidStoreRequest.json')
const validRetrieveEventData = require('../events/ValidRetrieveRequest.json')
const invalidRetrieveEventData = require('../events/InvalidRetrieveRequest.json')
const validSendCodeEventData = require('../events/ValidSendCodeRequest.json')
//const validNukeAccountEventData = require('../events/ValidNukeAccountRequest.json')
const validGetAuthorizedRequest = require('../events/ValidGetAuthorizedRequest.json')

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

  it('/v1/authorizedRequests GET returns 404 for not found requests', () => {
    return wrapped.run(validGetAuthorizedRequest).then((response) => {
      expect(response.statusCode).to.equal(404);
    });
  });

  // it('/v1/nuke POST (send) returns 200 for valid requests', async () => {
  //   await writeTestVerificationCode(1234, '6095551414', false)
  //   return wrapped.run(validNukeAccountEventData).then((response) => {
  //     expect(response.statusCode).to.equal(200);
  //   });
  // });

  // it('/v1/nuke POST (send) returns 401 for valid requests with invalid verification code', async () => {
  //   await writeTestVerificationCode(1234, '6095551414', true)
  //   return wrapped.run(validNukeAccountEventData).then((response) => {
  //     expect(response.statusCode).to.equal(401);
  //   });
  // });

});
