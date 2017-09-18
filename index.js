"use strict"

// Dependencies
// ===

// web server
const Express = require("express")

// Logging
const Winston = require("winston")

const config = require("config")

const TrackRouter = require("./app/trackRouter.js")

const {setupServer} = require("./lib/expressUtil")

var logger = new (Winston.Logger)({
  level: config.logLevel,
  transports: [
    new (Winston.transports.Console)()
  ]
})

var app = Express()
setupServer(app, logger)

app.get("/", (request, response) => {
  response.send("hello friend")
})

const trackRouter = new TrackRouter(logger)
app.use("/track", trackRouter.router)

app.listen(config.port)

logger.info(`MIXPANEL_API_HOST: ${config.mixpanelApiHost}`)
logger.info(`NODE_ENV: ${process.env.NODE_ENV}`)
logger.info(`metric-proxy up on localhost:${config.port}`)
