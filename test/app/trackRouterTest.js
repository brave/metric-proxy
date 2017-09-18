const test = require('tape')
const config = require('config')
const Express = require('express')
const nock = require('nock')
const request = require('request')

const testHelper = require('../testHelper')
const TrackRouter = require('../../app/trackRouter')
const {decodeBase64, encodeBase64} = require("../../lib/base64Util")
const USER_AGENT = require("../../lib/userAgent")
const {setupServer} = require("../../lib/expressUtil")

test('trackRouter', (t) => {
  t.plan(1)

  const app = Express()
  const trackRouter = new TrackRouter(testHelper.testLogger())
  setupServer(app)
  app.use('/', trackRouter.router)

  const server = app.listen(0, 'localhost', () => {
    const baseUrl = `http://localhost:${server.address().port}`
    console.log(`server up on ${baseUrl}`)

    const baseOptions = {
      baseUrl,
      headers: {"User-Agent": USER_AGENT},
      url: '/'
    }
    const requestGet = (payload = {}, options = {}, callback = ()=>{}) => {
      const requestOptions = Object.assign(
        {qs: {}, method: 'GET'},
        baseOptions,
        options
      )
      Object.assign(requestOptions.qs, {data: encodeBase64(payload)})
      return request(requestOptions, callback)
    }
    const requestPost = (payload, options = {}, callback = ()=>{}) => {
      const requestOptions = Object.assign(
        {form: {}, method: 'POST'},
        baseOptions,
        options
      )
      if (payload) {
        Object.assign(requestOptions.form, {data: encodeBase64(payload)})
      }
      return request(requestOptions, callback)
    }

    t.test('Shared: GET /, POST /', (t) => {
      t.plan(2)

      t.test('without params', (t) => {
        t.plan(2)
        const callback = (_error, response, _body) => {
          if (response.statusCode >= 400 && response.statusCode <= 499) {
            t.pass('returns 4xx error')
          } else {
            t.fail('should not work')
          }
        }
        requestGet(undefined, {}, callback)
        requestPost(undefined, {}, callback)
      })

      t.test('valid params', (t) => {
        t.plan(2)

        const payload = {
          event: "sweet",
          properties: {category: "sweet", token: config.mixpanelTokenWhitelist}
        }
        const checkPayload = (requestPayload) => {
          t.deepEquals(payload, decodeBase64(requestPayload.data), 'params pass through to mixpanel')
          return true
        }
        nock(config.mixpanelApiHost)
          .get('/track')
          .query(checkPayload)
          .reply(200)
        requestGet(payload)
        nock(config.mixpanelApiHost)
          .post('/track', checkPayload)
          .reply(200)
        requestPost(payload)
      })
    })
  })

  test.onFinish(() => {
    server.close()
  })
})
