const Winston = require('winston')

module.exports.testLogger = () => {
  return new (Winston.Logger)({
    level: 'debug',
    transports: [
      new (Winston.transports.Console)()
    ]
  })
}
