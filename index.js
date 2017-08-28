"use strict"

// Dependencies
// ===

const bodyParser = require("body-parser")

const CookieParser = require("cookie-parser")

// web server
const Express = require("express")

// HTTP requests
const Request = require("request")

// Logging
const Winston = require("winston")

const cookieUtil = require("./lib/cookieUtil")
const mixpanelUtil = require("./lib/mixpanelUtil")


// Config
// ===

const MIXPANEL_API_HOST = process.env.MIXPANEL_API_HOST || "https://api.mixpanel.com"
// e.g. token1234a,token5678b
const NODE_ENV = process.env.NODE_ENV || "development"
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === "production" ? "info" : "debug")
const PORT = process.env.PORT || 4000
const USER_AGENT = `metric-proxy/${process.env.npm_package_version} (brave.com)`

// Logging
// ===

var logger = new (Winston.Logger)({
  level: LOG_LEVEL,
  transports: [
    new (Winston.transports.Console)()
  ]
})

// Log Request responses from Mixpanel
function logRequestResponse(response) {
  logger.debug("<<", response.statusCode)
  logger.debug("<<", response.headers)
}

// App fn
// ===

// https://mixpanel.com/help/reference/http
function mixpanelTrackGet(request, response) {
  try {
    logger.info(`-> ${request.method} /track`)
    // Save certain query params across requests with cookies
    cookieUtil.persistParamsAsCookies(request, response)
    const queryString = mixpanelUtil.buildMixpanelTrackQueryString(request, response)
    const mixpanelRequestOptions = {
      headers: {
        "User-Agent": USER_AGENT
      },
      qs: queryString
    }

    logger.debug(`API > ${request.method} ${MIXPANEL_API_HOST}/track`, mixpanelRequestOptions)
    Request(`${MIXPANEL_API_HOST}/track`, mixpanelRequestOptions).
      on("error", (error) => {
        logger.error(error)
        response.status(502).send("0")
      }).
      on("response", function(response) {
        if (LOG_LEVEL === "debug") {
          logRequestResponse(response)
        }
      }).
      pipe(response)

  } catch (_e) {
    if (_e.stack) {
      logger.error(_e.stack.split("\n").slice(0, 4).join(";"))
    } else {
      logger.error(_e)
    }
    response.send("0")
  }
}


// App
// ===

// Express setup
// ---
var express = Express()
express.disable("x-powered-by")
if (cookieUtil.COOKIE_SIGNING_SECRET) {
  express.use(CookieParser(cookieUtil.COOKIE_SIGNING_SECRET))
} else {
  express.use(CookieParser())
}
const urlencodedParser = bodyParser.urlencoded({ extended: false })
express.use(urlencodedParser)
if (LOG_LEVEL === "debug") {
  const {debugRequestLogger} = require("./lib/logUtil")
  express.use(debugRequestLogger(logger))
}

// Routes
// ---
express.get("/", (request, response) => {
  response.send("hello friend")
})

express.get("/track", mixpanelTrackGet)
express.post("/track", mixpanelTrackGet)

express.listen(PORT)

logger.info(`MIXPANEL_API_HOST: ${MIXPANEL_API_HOST}`)
logger.info(`NODE_ENV: ${NODE_ENV}`)
logger.info(`metric-proxy up on localhost:${PORT}`)
