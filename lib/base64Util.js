const decodeBase64 = function (string) {
  const dataString = decodeURI(Buffer.from(string, "base64").toString("utf-8"))
  // HACK: Handle mixpanel iOS Swift 2.x library which sends single quoted JSON.
  return JSON.parse(dataString.replace(/'/g, "\""))
}

const encodeBase64 = function (object) {
  const string = JSON.stringify(object)
  return Buffer.from(string, "utf-8").toString("base64")
}

module.exports = {
  decodeBase64,
  encodeBase64
}
