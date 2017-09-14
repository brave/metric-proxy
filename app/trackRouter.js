"use strict"

// web server
const Express = require("express")

// HTTP requests
const Request = require("request")

const config = require("config")

const cookieUtil = require("../lib/cookieUtil")
const mixpanelUtil = require("../lib/mixpanelUtil")

const USER_AGENT = `metric-proxy/${process.env.npm_package_version} (brave.com)`

class TrackRouter {
  constructor(logger) {
    this.logger = logger
    this.router = Express.Router()
    this.router.get("/", this.mixpanelTrackGet.bind(this))
    this.router.post("/", this.mixpanelTrackPost.bind(this))
  }

  router() {
    return this.router
  }

  // https://mixpanel.com/help/reference/http
  mixpanelTrackGet(request, response) {
    try {
      this.logger.info(`-> ${request.method} /track`)
      // Save certain query params across requests with cookies
      cookieUtil.persistParamsAsCookies(request, response)
      const queryString = mixpanelUtil.buildMixpanelTrackQueryString(request, response)
      const mixpanelRequestOptions = {
        headers: {
          "User-Agent": USER_AGENT
        },
        qs: queryString
      }

      this.logger.debug(`API > ${request.method} ${config.mixpanelApiHost}/track`, mixpanelRequestOptions)
      Request(`${config.mixpanelApiHost}/track`, mixpanelRequestOptions).
        on("error", (error) => {
          this.logger.error(error)
          response.status(502).send("0")
        }).
        on("response", (response) => {
          if (config.logLevel === "debug") {
            this.logRequestResponse(response)
          }
        }).
        pipe(response)

    } catch (_e) {
      if (_e.stack) {
        this.logger.error(_e.stack.split("\n").slice(0, 4).join(";"))
      } else {
        this.logger.error(_e)
      }
      response.send("0")
    }
  }

  mixpanelTrackPost(request, response) {
    // const logger = this.logger
    try {
      this.logger.info(`-> ${request.method} /track`)
      // Save certain query params across requests with cookies
      cookieUtil.persistParamsAsCookies(request, response)
      const data = mixpanelUtil.buildMixpanelTrackBody(request, response)
      const mixpanelRequestOptions = {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT
        },
        form: data
      }

      this.logger.debug(`API > ${request.method} ${config.mixpanelApiHost}/track`, mixpanelRequestOptions)
      Request(`${config.mixpanelApiHost}/track`, mixpanelRequestOptions).
        on("error", (error) => {
          this.logger.error(error)
          response.status(502).send("0")
        }).
        on("response", (response) => {
          if (config.logLevel === "debug") {
            this.logRequestResponse(response)
          }
        }).
        pipe(response)

    } catch (_e) {
      if (_e.stack) {
        this.logger.error(_e.stack.split("\n").slice(0, 4).join(";"))
      } else {
        this.logger.error(_e)
      }
      response.send("0")
    }
  }

  // Log Request responses from Mixpanel
  logRequestResponse(response) {
    this.logger.debug("<<", response.statusCode)
    this.logger.debug("<<", response.headers)
  }
}

module.exports = TrackRouter
