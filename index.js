"use strict"

// Dependencies
// ===

const bodyParser = require("body-parser")

const CookieParser = require("cookie-parser")

// web server
const Express = require("express")

// Logging
const Winston = require("winston")

const cookieUtil = require("./lib/cookieUtil")

const config = require("config")

const TrackRouter = require("./app/trackRouter.js")

var logger = new (Winston.Logger)({
  level: config.logLevel,
  transports: [
    new (Winston.transports.Console)()
  ]
})

var express = Express()
express.disable("x-powered-by")
if (cookieUtil.COOKIE_SIGNING_SECRET) {
  express.use(CookieParser(cookieUtil.COOKIE_SIGNING_SECRET))
} else {
  express.use(CookieParser())
}
const urlencodedParser = bodyParser.urlencoded({ extended: false })
express.use(urlencodedParser)
if (config.logLevel === "debug") {
  const {debugRequestLogger} = require("./lib/logUtil")
  express.use(debugRequestLogger(logger))
}

express.get("/", (request, response) => {
  response.send("hello friend")
})

const trackRouter = new TrackRouter(logger)
express.use("/track", trackRouter.router)

express.listen(config.port)

logger.info(`MIXPANEL_API_HOST: ${config.mixpanelApiHost}`)
logger.info(`NODE_ENV: ${process.env.NODE_ENV}`)
logger.info(`metric-proxy up on localhost:${config.port}`)
