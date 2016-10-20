var http = require('http')
var dispatcher = require('httpdispatcher')

const PORT = 8080


var Fiber = require('fibers');

// Generator function. Returns a function which returns incrementing
// Fibonacci numbers with each call.
function Fibonacci() {
    // Create a new fiber which yields sequential Fibonacci numbers
    var fiber = Fiber(() => {
        Fiber.yield(0) // F(0) -> 0
        var prev = 0, curr = 1
        while (true) {
            Fiber.yield(curr)
            var tmp = prev + curr
            prev = curr
            curr = tmp
        }
    })
    // Return a bound handle to `run` on this fiber
    return fiber.run.bind(fiber)
}

// Initialize a new Fibonacci sequence and iterate up to 1597
var seq = Fibonacci()
var ii



var Future = require('fibers/future'), wait = Future.wait

var n = 5000

// This function returns a future which resolves after a timeout. This
// demonstrates manually resolving futures.
function sleep(ms) {
  var future = new Future
  setTimeout(() => {
    future.return()
  }, ms)
  return future
}

// You can create functions which automatically run in their own fiber and
// return futures that resolve when the fiber returns (this probably sounds
// confusing.. just play with it to understand).
var calcTimerDelta = function(ms) {
  var start = new Date
  sleep(ms).wait()
  return new Date - start
}.future() // <-- important!

function resolved(err, val) {
  n--
  console.log('Set timer, waited ' + val + 'ms; n is ' + n)
  calcTimerDelta(1000).resolve(resolved)
}

// And futures also include node-friendly callbacks if you don't want to use
// wait()
calcTimerDelta(1000).resolve(resolved)



dispatcher.onGet("/", (req, res) => {
  ii = seq()
  console.log(ii)
  n += 10

  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.end(`heres ur number: ${ii}`)
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
