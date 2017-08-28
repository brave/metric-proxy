"use strict"

const NODE_ENV = process.env.NODE_ENV || "development"
const COOKIE_PERSISTED_PARAMS = process.env.COOKIE_PERSISTED_PARAMS
  ? process.env.COOKIE_PERSISTED_PARAMS.split(",")
  : ["campaign", "creative", "placement", "referer", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
const PERSISTED_COOKIE_NAME = "metricProxy"
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN
const COOKIE_SECURE_ATTRIBUTE = (NODE_ENV === "production")
const COOKIE_SIGNING_SECRET = process.env.COOKIE_SIGNING_SECRET || null
const COOKIE_TTL = 14 * 24 * 60 * 60 * 1000

/**
 * Takes an example URL with tracking parameters and persists them to cookies.
 * Alternative to the mixpanel library, which persists things like utm_* as
 * Super Properties.
 * Useful where JS is unavailable like tracking pixels or click redirects.
 * @return {object} persisted params
 */
const persistParamsAsCookies = function (request, response) {
  let cookieParams = {}
  COOKIE_PERSISTED_PARAMS.forEach((key) => {
    if (!request.query[key]) {
      return
    }
    cookieParams[key] = request.query[key]
  })
  if (Object.keys(cookieParams).length === 0) {
    return {}
  }
  let options = {
    httpOnly: true,
    expires: new Date(Date.now() + COOKIE_TTL),
    secure: COOKIE_SECURE_ATTRIBUTE,
    signed: !!COOKIE_SIGNING_SECRET
  }
  if (COOKIE_DOMAIN) {
    options["domain"] = COOKIE_DOMAIN
  }
  // logger.debug(`<< Cookie: ${PERSISTED_COOKIE_NAME}:`, cookieParams)
  response.cookie(PERSISTED_COOKIE_NAME, cookieParams, options)
  return cookieParams
}

const restorePersistedParams = function (request, response) {
  if (!request.cookies[PERSISTED_COOKIE_NAME]) {
    return {}
  }
  // TODO: More logics
  return request.cookies[PERSISTED_COOKIE_NAME]
}

module.exports = {
  COOKIE_PERSISTED_PARAMS,
  COOKIE_SIGNING_SECRET,
  persistParamsAsCookies,
  restorePersistedParams
}
