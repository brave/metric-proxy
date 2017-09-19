const test = require('tape')
const config = require('config')
const Express = require('express')
const nock = require('nock')
const request = require('request')

const testHelper = require('../testHelper')
const TrackRouter = require('../../app/trackRouter')
const {decodeBase64, encodeBase64} = require("../../lib/base64Util")
const {setupServer} = require("../../lib/expressUtil")
const PROPERTIES_WHITELIST = require("../../constants/propertiesWhitelist")
const USER_AGENT = require("../../lib/userAgent")

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
      t.plan(3)

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
          properties: {distinct_id: "42", token: config.mixpanelTokenWhitelist}
        }
        const checkPayload = (requestPayload) => {
          t.deepEquals(payload, decodeBase64(requestPayload.data), 'params pass through to mixpanel')
          return true
        }

        const testPost = () => {
          nock(config.mixpanelApiHost)
            .post('/track', checkPayload)
            .reply(200)
          requestPost(payload)
        }
        nock(config.mixpanelApiHost)
          .get('/track')
          .query(checkPayload)
          .reply(200)
        requestGet(payload, {}, testPost)
      })

      t.test('properties filtering', (t) => {
        t.plan(2)

        // Prepare event which contains a mix of whitelisted and
        // non-whitelisted propoerties.
        const payload = {
          event: "sweet",
          properties: {}
        }
        const PROPERTIES_NOT_WHITELISTED = [
          "mp_lib",
          "$lib_version",
          "$model"
        ]
        for (let prop of PROPERTIES_WHITELIST) {
          payload.properties[prop] = 1
        }
        for (let prop of PROPERTIES_NOT_WHITELISTED) {
          payload.properties[prop] = 1
        }
        payload.properties.token = config.mixpanelTokenWhitelist
        const PROPERTIES_COUNT = PROPERTIES_WHITELIST.length + PROPERTIES_NOT_WHITELISTED.length

        const checkPayloadEvent = function (event, t) {
          for (let prop of PROPERTIES_WHITELIST) {
            t.true(event.properties.hasOwnProperty(prop), `retains event properties."${prop}"`)
          }
          for (let prop of PROPERTIES_NOT_WHITELISTED) {
            t.false(event.properties.hasOwnProperty(prop), `scrubs event properties."${prop}"`)
          }
        }

        t.test('GET /', (t) => {
          t.plan(PROPERTIES_COUNT)

          const checkPayload = (requestPayload) => {
            const decodedPayload = decodeBase64(requestPayload.data)
            checkPayloadEvent(decodedPayload, t)
            return true
          }
          nock(config.mixpanelApiHost)
            .get('/track')
            .query(checkPayload)
            .reply(200)
          requestGet(payload)
        })

        t.test('POST /', (t) => {
          t.plan(PROPERTIES_COUNT * 2)

          const postPayload = [
            Object.assign({}, payload),
            Object.assign({}, payload),
          ]
          const checkPayload = (requestPayload) => {
            const decodedPayload = decodeBase64(requestPayload.data)
            checkPayloadEvent(decodedPayload[0], t)
            checkPayloadEvent(decodedPayload[1], t)
            return true
          }
          nock(config.mixpanelApiHost)
            .post('/track', checkPayload)
            .reply(200)
          requestPost(postPayload)
        })
      })
    })
  })

  test.onFinish(() => {
    server.close()
  })
})
