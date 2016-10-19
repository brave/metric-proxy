var http = require('http')
var dispatcher = require('httpdispatcher')

const PORT = 8080

dispatcher.onGet("/", (req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.end('i love anon')
})

dispatcher.onPost("/v1/track", (req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.end('u posted me')
})

function handleRequest(request, response) {
    try {
      console.log(request.url)
      dispatcher.dispatch(request, response)
    } catch(err) {
      console.log(err)
    }
}

var server = http.createServer(handleRequest)

server.listen(PORT, () => {
  console.log("Server listening on: http://localhost:%s", PORT)
})
