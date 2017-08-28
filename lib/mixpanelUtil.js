"use strict"

const cookieUtil = require("./cookieUtil")

const MIXPANEL_TOKEN_WHITELIST = process.env.MIXPANEL_TOKEN_WHITELIST.split(",")

const isValidMixpanelToken = function (token) {
  if (!token) {
    return false
  }
  // HACK: Handle mixpanel iOS Swift 2.x library which sends token as "Optional({token})"
  return MIXPANEL_TOKEN_WHITELIST.some((whitelistToken) => {
    return token.includes(whitelistToken)
  })
}

const assertValidMixpanelTrackEvent = function (trackEvent) {
  if (!trackEvent.event) {
    throw "event.event is required"
  }
  if (!trackEvent.properties) {
    throw "event.properties is required"
  }
  const token = trackEvent.properties.token
  if (!isValidMixpanelToken(token)) {
    throw `event has invalid mixpanel token: ${token}`
  }
  return true
}

/**
 * XXX This is for the GET /track endpoint.
 * Mixpanel data includes:
 * - Original request query string -- certain params
 * - Certain other query params, moved from top level into data.properties
 * - Persisted params from previous requests, via cookies
 * @returns {object} Base64 encoded data payload for use with Mixpanel /track endpoint
 */
const buildMixpanelTrackQueryString = function (request, response) {
  if (!request.query.data) {
    throw "Query missing"
  }

  const dataString = decodeURI(Buffer.from(request.query.data, "base64").toString("utf-8"))
  // HACK: Handle mixpanel iOS Swift 2.x library which sends single quoted JSON.
  const data = JSON.parse(dataString.replace(/'/g, "\""))
  assertValidMixpanelTrackEvent(data)

  let queryString = { data }
  // /track supports other params but not sure if we want them
  const queryStringParams = ["img", "verbose"]
  queryStringParams.forEach((value) => {
    if (!request.query[value]) {
      return
    }
    queryString[value] = request.query[value]
  })

  // Copy special params from query string
  cookieUtil.COOKIE_PERSISTED_PARAMS.forEach((key) => {
    if (!request.query[key]) {
      return
    }
    queryString.data.properties[key] = request.query[key]
  })

  // Restore persisted params
  const restoredParams = cookieUtil.restorePersistedParams(request, response)
  if (Object.keys(restoredParams).length > 0) {
    for (let key in restoredParams) {
      if (queryString.data.properties[key]) {
        continue
      }
      queryString.data.properties[key] = restoredParams[key]
    }
  }

  // logger.debug("API > Query/data:", queryString.data)
  const returnDataString = JSON.stringify(queryString.data)
  queryString.data = Buffer.from(returnDataString, "utf-8").toString("base64")
  return queryString
}

/**
 * XXX This is for the POST /track endpoint, using batch events.
 * @returns {object} Base64 encoded data payload for use with Mixpanel /track endpoint
 */
const buildMixpanelTrackBody = function (request, response) {
  if (!request.body || !request.body.data) {
    throw "Body missing"
  }

  const dataString = decodeURI(Buffer.from(request.body.data, "base64").toString("utf-8"))
  // HACK: Handle mixpanel iOS Swift 2.x library which sends single quoted JSON.
  const data = JSON.parse(dataString.replace(/'/g, "\""))

  // Check each data event for validity, and restore persisted params
  const restoredParams = cookieUtil.restorePersistedParams(request, response)
  for (let i = 0; i < data.length; i++) {
    const event = data[i]
    assertValidMixpanelTrackEvent(event)

    for (let key in restoredParams) {
      if (event.properties[key]) {
        continue
      }
      // Copy persisted param in place
      data[i].properties[key] = restoredParams[key]
    }
  }

  // logger.debug("API > Query/data:", queryString.data)
  const returnDataString = JSON.stringify(data)
  const returnBody = {
    data: Buffer.from(returnDataString, "utf-8").toString("base64")
  }

  // Other body params
  if (request.body.verbose) {
    returnBody.verbose = request.body.verbose
  }
  return returnBody
}

module.exports = {
  isValidMixpanelToken,
  assertValidMixpanelTrackEvent,
  buildMixpanelTrackQueryString,
  buildMixpanelTrackBody
}