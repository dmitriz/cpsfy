# tiny-cps
Tiny goodies for Continuation-Passing-Style functions

# CPS functions

## Terminology
A *Continuation-Passing-Style (CPS) function* is any JavaScript function
```js
const cps = (f1, f2, ...) => { ... }
```
that expects to be called with zero or several functions as its arguments.
The number of arguments can change from call to call and is not required to be bounded.

By *parametrized CPS function* we mean any curried function with zero or more parameters 
that returns a CPS function:
```js
const paramCps = (param1, param2, ...) => (f1, f2, ...) => { ... }
```

We shall adopt somewhat loose terminology calling *parametrized CPS functions* both
the curried function `paramCps` and its return value `paramCps(params)`,
in the hope that the context will make clear the precisce meaning.
In the same vein, by a function call of the parametrized CPS function,
we mean its call with both parameters and callbacks passed.
Otherwise `parmCps(params)` is considered a *partial call*.

## Motivation
A common weakness of the callback-passing style among other arguments
is mixing the function input with output, making the code harder to read.

In contrast, the parametrized CPS functions do not suffer from this problem.
Their curried nature ensures clean separation between the input parameters
and the callbacks that are used to hold the output only.
The principle here is analogous to how that separation is achieved by promises,
except that CPS function do not impose any restricitons on the 
number of the output events as well as the number of arguments passed with each callback call.

# Examples of CPS functions

## Promise producers
Any producer (aka executor) function 
```js
const producer = function(resolve, reject) { ... }
``` 
passed to the [Promise constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) is an example of a CPS function. 

The constructed promise `new Promise(producer)` only keeps the very first call of either of the callbacks,
whereas the producer function itself can call its callbacks multiple times,
each of which is regarded as output of the CPS function and is retained.

## Promises
Any JavaScript promise generates the CPS function via its `.then` method invocation
that completely captures the information held by the promise:
```js
const cpsPromise = (onFulfilled, onRejected) = promise.then(onFulfilled, onRejected)
```
The important restictions for CPS functions arising that way are:
1. At most one callback function is called.
2. Each of the callback functions is called precisely with one argument.

The CPS functions do assume such restrictions.


## Node API
Any Node-Style function with one of more callbacks can be curried into a parametrized CPS function:
```js
const readFileCPS = (path, options) => callback => fs.readFile(path, options, callback)
```
Here `readFileCPS` returns a CPS function for each values of its parameters `(path, options)`.

Typically Node API callbacks are called with at least two arguments as `callback(error, arg1, ...)`,
where the first argument is used as indication of error. 
The CPS functions include this case by not restricting the number arguments 
passed to any of its callback functions.


## HTTP requests
In a similar vein, any HTTP request with callback(s) can be regarded as parametrized CPS function:
```js
const = (url, options, data) => cb => request(url, options, data, cb)
```

## Database Access
Any async database access API with callback can be curried into parametrized CPS functions:
```js
const queryDb = (db, query) => callback => getQuery(db, query, callback)
const insertDb = (db, data) => callback => inserData(db, data, callback)
```
In most cases each of these is considered a single request resulting in either success of failure.
However, more general CPS functions can implement more powerful functionality with multiple callback calls.
For instance, the function can run multiple data insetion attempts with progress reported back to client.
Or the query function can return its result in multiple chunks, each with a separate callback call.
Further, the Database query funtion can hold a state that is advanced with each call.
Similarly, any Database access can be cancelled by subsequent call of the same CPS function with suitable parameters. 

## Web Sockets
Here is a generic CPS function parametrized by its url `path`:
```js
const WebSocket = require('ws')
const createWS = path => callback => 
  new WebSocket(path).on('message', callback)
```
The callback will be called repeatedly with every new socket value emited.

## Pull Streams
A [Pull-stream](https://pull-stream.github.io/)
is essentially a function `f(params, callback)` that is called repeatedly
by the sink to produce on-demand stream of data.
Any such function can be clearly curried into a
is a parametrized CPS function 
```js
const pullStream = params => callback => {...}
```
