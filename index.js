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
const MIXPANEL_TOKEN_WHITELIST = process.env.MIXPANEL_TOKEN.split(",")
const PORT = process.env.PORT || 4000


// Lib
// ===

var logger = new (Winston.Logger)({
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
    if (!isValidMixpanelTrackData(data)) {
      throw "Invalid data"
    } else if (!isProbablyAnonymousData(data)) {
      throw "Event contains identifying data"
    }

    // /track supports other params but not sure if we want them
    const queryString = { data: request.query.data, verbose: request.query.verbose }
    const options = { qs: queryString }
    Request(`${MIXPANEL_API_HOST}/track`, options).pipe(response)

  } catch (_e) {
    logger.log('warn', _e)
    response.send("0")
  }
}

function isValidMixpanelTrackData(data) {
  return (data.event && data.properties && isValidMixpanelToken(data.properties.token))
}

function isProbablyAnonymousData(data) {
  return (data.properties && !data.properties.distinct_id && !data.properties.ip)
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

logger.log("info", `metric-proxy up on localhost:${PORT}`)
logger.log("info", `MIXPANEL_API_HOST: ${MIXPANEL_API_HOST}`)
