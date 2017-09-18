"use strict"

const {decodeBase64} = require("./base64Util")

/**
 * Verbose logging for debug/dev environments.
 * XXX: To preserve privacy, do not log production user data!
 * Usage: debugRequestLogger(winstonLogger))
 * @param {Object} logger instance of Winston logger, or something that implements .debug()
 * @return {function} fn you can use with express.use({fn})
 */
const debugRequestLogger = function (logger) {
  return function (request, response, next) {
    logger.debug("-> Headers:", request.headers)
    if (request.cookies) {
      for (let cookieName in request.cookies) {
        logger.debug(`-> Cookie: ${cookieName}:`, request.cookies[cookieName])
      }
    }

    if (request.query.data) {
      logger.debug("-> Query:", request.query)
      const data = decodeBase64(request.query.data)
      logger.debug("-> Query data:", data)
    } else {
      logger.debug("-> Query: (empty)")
    }

    if (request.body) {
      logger.debug("-> Body:", request.body)
      // HACK: Handle mixpanel iOS Swift 2.x library which sends single quoted JSON.
      // const dataBody = JSON.parse(request.body.replace(/'/g, "\""))
      // logger.debug("-> Body data:", dataBody)
    } else {
      logger.debug("-> Body: (empty)")
    }

    next()
  }
}

module.exports = {
  debugRequestLogger
}
