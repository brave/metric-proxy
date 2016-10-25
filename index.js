"use strict"

// Dependencies
// ===

// web server
const Express = require("express")

// better than debugger
const Pry = require("pryjs")

// HTTP requests
const Request = require("request")

// Logging
const Winston = require("winston")


// Config
// ===

const MIXPANEL_API_HOST = process.env.MIXPANEL_API_HOST || "https://api.mixpanel.com"
// e.g. token1234a,token5678b
const MIXPANEL_TOKEN_WHITELIST = process.env.MIXPANEL_TOKEN_WHITELIST.split(",")
const NODE_ENV = process.env.NODE_ENV || "development"
const LOG_LEVEL = NODE_ENV === "production" ? "info" : "debug"
const PORT = process.env.PORT || 4000
const USER_AGENT = `metric-proxy/${process.env.npm_package_version} (brave.com)`


// Lib
// ===

var logger = new (Winston.Logger)({
  level: LOG_LEVEL,
  transports: [
    new (Winston.transports.Console)()
  ]
})

function isValidMixpanelToken(token) {
  if (!token) {
    return false
  }
  return MIXPANEL_TOKEN_WHITELIST.includes(token)
}


// App fn
// ===

// https://mixpanel.com/help/reference/http
function mixpanelTrack(request, response) {
  try {
    const dataString = Buffer.from(request.query.data, "base64").toString("utf-8")
    const data = JSON.parse(dataString)
    logger.info("-> /track")
    logger.debug("-> Headers:", request.headers)
    logger.debug("-> Cookie:", request.headers.cookie)
    logger.debug("-> Query:", request.query)
    logger.debug("-> Data:", data)
    if (!isValidMixpanelTrackData(data)) {
      throw "Invalid data"
    }

    // /track supports other params but not sure if we want them
    let queryString = {}
    const queryStringParams = ["data", "img", "verbose"]
    queryStringParams.forEach((value) => {
      if (!request.query[value]) {
        return
      }
      queryString[value] = request.query[value]
    })
    const options = {
      headers: {
        // 'Cookie': request.headers.cookie,
        'User-Agent': USER_AGENT
      },
      qs: queryString
    }

    logger.debug(`<- ${MIXPANEL_API_HOST}/track`, options)
    Request(`${MIXPANEL_API_HOST}/track`, options).
      on("error", (error) => {
        logger.error(error)
        response.status(502).send("0")
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

function isValidMixpanelTrackData(data) {
  return (data.event && data.properties && isValidMixpanelToken(data.properties.token))
}


// App
// ===

var app = Express()
app.disable("x-powered-by")

app.get("/", (request, response) => {
  response.send("hello friend")
})

app.get("/track", mixpanelTrack)
app.post("/track", mixpanelTrack)

app.listen(PORT)

logger.info(`MIXPANEL_API_HOST: ${MIXPANEL_API_HOST}`)
logger.info(`NODE_ENV: ${NODE_ENV}`)
logger.info(`metric-proxy up on localhost:${PORT}`)
