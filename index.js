// Dependencies
// ===

// web server
const Express = require("express")

// text which is hyper
const Http = require("http")

// better than debugger
const Pry = require("pryjs")

// HTTP requests
const Request = require("request")


// Config
// ===

const MIXPANEL_API_HOST = process.env.MIXPANEL_API_HOST || "https://api.mixpanel.com"
// e.g. token1234a,token5678b
const MIXPANEL_TOKEN_WHITELIST = process.env.MIXPANEL_TOKEN.split(",")
const PORT = process.env.PORT || 4000


// Lib
// ===

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
    const dataString = new Buffer(request.query.data, "base64").toString("utf-8")
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
    console.log(_e)
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

app.get("/", (request, response) => {
  res.send("hello friend")
})

app.get("/track", mixpanelTrack)
app.post("/track", mixpanelTrack)

app.listen(PORT)

console.log(`metric-proxy up on localhost:${PORT}`)
