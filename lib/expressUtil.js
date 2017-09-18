const config = require("config")
const bodyParser = require("body-parser")
const CookieParser = require("cookie-parser")

const cookieUtil = require("./cookieUtil")

const cookieParser = function () {
  if (cookieUtil.COOKIE_SIGNING_SECRET) {
    return CookieParser(cookieUtil.COOKIE_SIGNING_SECRET)
  } else {
    return CookieParser()
  }
}

const setupServer = function (express, logger) {
  express.disable("x-powered-by")
  express.use(cookieParser())
  const urlencodedParser = bodyParser.urlencoded({ extended: false })
  express.use(urlencodedParser)
  if (logger && config.logLevel === "debug") {
    const {debugRequestLogger} = require("./logUtil")
    express.use(debugRequestLogger(logger))
  }
}

module.exports = {
  setupServer
}
