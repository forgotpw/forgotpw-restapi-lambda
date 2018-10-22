const chai = require('chai')
const assert = chai.assert;
const UserTokenService = require('../lib/userTokenService')

describe('convertPhoneToE164Format', function () {
  it('should parse US number without calling code (+1) with US country code', function () {
    let userTokenService = new UserTokenService()
    let e164 = userTokenService.convertPhoneToE164Format('6095551212', 'US')
    assert.equal(e164, '+16095551212')
  });
  it('should parse US number with calling code (1) with US country code', function () {
    let userTokenService = new UserTokenService()
    let e164 = userTokenService.convertPhoneToE164Format('16095551212', 'US')
    assert.equal(e164, '+16095551212')
  });
  it('should parse US number with calling code (+1) with US country code', function () {
    let userTokenService = new UserTokenService()
    let e164 = userTokenService.convertPhoneToE164Format('+16095551212', 'US')
    assert.equal(e164, '+16095551212')
  });
  it('should parse US number with calling code (+1) with foreign country code', function () {
    let userTokenService = new UserTokenService()
    let e164 = userTokenService.convertPhoneToE164Format('+16095551212', 'RU')
    assert.equal(e164, '+16095551212')
  });
  it('should parse US number with dashes with US country code', function () {
    let userTokenService = new UserTokenService()
    let e164 = userTokenService.convertPhoneToE164Format('609-555-1212', 'US')
    assert.equal(e164, '+16095551212')
  });
  it('should parse US number with spaces with US country code', function () {
    let userTokenService = new UserTokenService()
    let e164 = userTokenService.convertPhoneToE164Format('  609 555 1212  ', 'US')
    assert.equal(e164, '+16095551212')
  });
  it('should parse RU number without calling code, with RU country code provided', function () {
    let userTokenService = new UserTokenService()
    let e164 = userTokenService.convertPhoneToE164Format('800 555 35 35', 'RU')
    assert.equal(e164, '+78005553535')
  });
  it('should parse RU number with calling code without RU country code provided', function () {
    let userTokenService = new UserTokenService()
    let e164 = userTokenService.convertPhoneToE164Format('+7 800 555 35 35', 'US')
    assert.equal(e164, '+78005553535')
  });
});

describe('lookupUserToken', function () {
  it('should return null when looking up a non-existant user token', async function () {
    let userTokenService = new UserTokenService()
    let userToken = await userTokenService.lookupUserToken('INVALIDfjkdsaljfkslj')
    assert.equal(userToken, null)
  });
});
