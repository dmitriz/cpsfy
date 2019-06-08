# cpsfy
Tiny but powerful goodies for Continuation-Passing-Style functions

> Simplicity is prerequisite for reliability. 
> Elegance is not a dispensable luxury but a factor that decides between success and failure.
> 
> --- [Edsger W. Dijkstra](https://www.azquotes.com/author/3969-Edsger_Dijkstra)
 
>```js
>// ignorant
>const getServerStuff = callback => ajaxCall(json => callback(json))
>// enlightened
>const getServerStuff = ajaxCall
>```
> --- From [Mostly adequate guide to Functional Programming](https://github.com/MostlyAdequate/mostly-adequate-guide).


<!-- AUTO-GENERATED-CONTENT:START (TOC:src=./DOCUMENTATION.md) -->
- [CPS functions](#cps-functions)
- [Why?](#why)
- [Advanced composability](#advanced-composability)
- [What is new here?](#what-is-new-here)
  * [Variadic input and output](#variadic-input-and-output)
  * [Full power of multiple outputs streams](#full-power-of-multiple-outputs-streams)
  * [Functional progamming paradigm](#functional-progamming-paradigm)
  * [Lazy or eager?](#lazy-or-eager)
  * [Differences with Haskell](#differences-with-haskell)
    + [JavaScript functions are by design not required to be [pure](https://en.wikipedia.org/wiki/Pure_function)](#javascript-functions-are-by-design-not-required-to-be-purehttpsenwikipediaorgwikipure_function)
    + [JavaScript functions are by design accepting arbitrary number of arguments](#javascript-functions-are-by-design-accepting-arbitrary-number-of-arguments)
  * ["Do less" is a feature](#do-less-is-a-feature)
- [Terminology](#terminology)
- [Using CPS functions](#using-cps-functions)
- [What about Callback Hell?](#what-about-callback-hell)
- [Asynchronous iteration over array](#asynchronous-iteration-over-array)
- [Examples of CPS functions](#examples-of-cps-functions)
- [Promise producers](#promise-producers)
- [Promises](#promises)
- [Node API](#node-api)
- [HTTP requests](#http-requests)
- [Database Access](#database-access)
- [Middleware e.g. in Express or Redux](#middleware-eg-in-express-or-redux)
- [Web Sockets](#web-sockets)
- [Stream libraries](#stream-libraries)
  * [Pull Streams](#pull-streams)
  * [Flyd](#flyd)
- [Event aggregation](#event-aggregation)
- [Comparison with Promises and Callbacks](#comparison-with-promises-and-callbacks)
- [Returning results](#returning-results)
- [Chaining](#chaining)
- [Asynchronous composition](#asynchronous-composition)
- [Error handling](#error-handling)
- [Functional signatures](#functional-signatures)
- [Standardization](#standardization)
- [Functional and Fluent API](#functional-and-fluent-api)
- [Conventions](#conventions)
- [CPS.map](#cpsmap)
  * [Mapping over single function](#mapping-over-single-function)
  * [Mapping over multiple functions](#mapping-over-multiple-functions)
  * [Map taking arbitrarily many functions with arbitrary numbers of arguments](#map-taking-arbitrarily-many-functions-with-arbitrary-numbers-of-arguments)
  * [Functor laws](#functor-laws)
  * [CPS.of](#cpsof)
- [CPS.chain](#cpschain)
  * [Transforming multiple arguments into multiple arguments](#transforming-multiple-arguments-into-multiple-arguments)
  * [Why is it called `chain`?](#why-is-it-called-chain)
  * [Composing multiple outputs](#composing-multiple-outputs)
  * [Passing multiple CPS functions to `chain`](#passing-multiple-cps-functions-to-chain)
  * [Monadic laws](#monadic-laws)
    + [Associativity law](#associativity-law)
    + [Identity laws](#identity-laws)
- [Application of `chain`: Turn Node API into Promise style callbacks](#application-of-chain-turn-node-api-into-promise-style-callbacks)
- [CPS.ap (TODO)](#cpsap-todo)
  * [Running CPS functions in parallel](#running-cps-functions-in-parallel)
  * [Lifting functions of multiple arguments](#lifting-functions-of-multiple-arguments)
    + [Promise.all](#promiseall)
    + [Usage notes](#usage-notes)
  * [Applying multiple functions inside `ap`](#applying-multiple-functions-inside-ap)
  * [Applicative laws](#applicative-laws)
- [CPS.merge (TODO)](#cpsmerge-todo)
  * [Relation with Promise.race](#relation-with-promiserace)
  * [Commutative Monoid](#commutative-monoid)
- [CPS.filter](#cpsfilter)
  * [Filtering over multiple functions](#filtering-over-multiple-functions)
  * [Implementation via `chain`](#implementation-via-chain)
- [CPS.scan](#cpsscan)
<!-- AUTO-GENERATED-CONTENT:END -->




# CPS functions

> [The Mother of all Monads](https://www.schoolofhaskell.com/school/to-infinity-and-beyond/pick-of-the-week/the-mother-of-all-monads)



## Why?
- Functions are among the most basic and powerful objects in JavaScript.
- Callbacks are prominent for events and asynchronous functions, but they don't make composition convenient (leading to the so-called "callback hell").
- Promises are more convenient to compose but introduce overheads, such as conditionally calling `then` and [do not conform to functor or monad laws and thus are not safe for compositional refactoring](https://stackoverflow.com/questions/45712106/why-are-promises-monads/50173415#50173415).
- Promises introduce limitations of being able to return only one value only once, that makes it difficult to update them or use uniformly along with streams.
- Promises provide only one error handling callback, forcing to handle all errors in the same function, and thus making writing smaller focused functions and separating concerns more difficult.
- The recent `async/await` notation retains the overheads of promises, in addition to ["new and exciting ways to shoot yourself in the foot"](https://thecodebarbarian.com/80-20-guide-to-async-await-in-node.js.html).


Functions are the most basic and powerful concept.
A whole program can be written as funciton,
taking input data and producing output.
However, viewing function's return value as the only output is often too limited.
For instance, all asynchronous Node API methods rely on the output data 
returned via callbacks rather than via functions' return values.
This pattern is of course the well-known 
[Continuation-Passing Style (CPS)](https://en.wikipedia.org/wiki/Continuation-passing_style)



## Advanced composability
The famous article by John Backus ["Can Programming Be Liberated from the von Neumann Style? A Functional Style and Its Algebra of Programs"](https://www.cs.ucf.edu/~dcm/Teaching/COT4810-Fall%202012/Literature/Backus.pdf)
advocated to "reduce the code obesity" by building generic hierarchical ways of composing entire programs.
The present proposal attempts to provide some way of how such composability can be achieved.


## What is new here?
Traditionally Continuation-Passing Style is implemented 
via callbacks as part of the function's parameters:
```js
const api = (input, callback) => doSomeWork(input, callback)
```
A fundamental problem here is that the input and output data are getting mixed
among function's parameters, making it hard to separate one from another.

Our main proposal is to solve this problem via currying:
```js
const api = input => callback => doSomeWork(input, callback)
```
Now the output is cleanly separated from the input via the function's curried signature.
Further parameters can easily be added to the input:
```js
const api = (input1, input2, ...) => callback => doSomeWork(input1, ..., callback)
```
as well as to the callbacks accepting output:
```js
const api = (input1, input2, ...) => (callback1, callbacks2, ...) => 
  doSomeWork(input1, ... , callback1, ...)
```

### Variadic input and output
JavaScript's functions are variadic by design,
that is, are capable of accepting arbitrary number of arguments at the runtime.
That feature makes it very convenient and powerful to implement optional parameters or set defaults:
```js
const f = (required, optionalWithDefault = default, iAmOptional) => { ... }
```
Now, given the clean separation provided by currying as mentioned above, 
we get for free the full functional variadic power provded by JS:
```js
const api = (...inputs) => (...callbacks) => doSomeWork(inputs, callbacks)
```
Here `...inputs` is the array holding all arguments passed to the function
at the run time, by means of the [Rest parameters syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters).
In particular, zero arguments are also allowed on each side.


### Full power of multiple outputs streams
By its design, JavaScript's function can call 
any of its callbacks arbitrarily many times at arbitrary moments.
This provides a simple implementation of multiple data streams
emitted from a single function.
Each stream value is passed as arguments of the callback,
that is, a whole list of values can be emitted at the same time
as arguments of the same function call.


### Functional progamming paradigm
The proposed curried design rests on the well-known paradigms.
It generalizes the [Kleisli arrows](https://en.wikipedia.org/wiki/Kleisli_category) 
`a -> m b` associated to the Monad `m`.
In our case, the Continuation Monad `m b` corresponds to passing single `callback` function
```js
const monad = callback => computation(callback)
```
and can be regarded as a "suspended computation".
The Monad structure is provided via the `of` and `chain` methods
(aka `return` and `bind` in Haskell, or `unit` and `flatMap` in Scala), see below.
As part of the variadic functionality, we generalize these Monadic methods
by allowing for arbitrary number of function arguments that are matched against the callbacks, see below.
This allows for easy handling of multiple output streams with single methods.

In addition to generalized Monadic methods dealing with sequential computations, 
generalized Applicative `ap` and derived `lift` are dealing with parallel ones.
As well as Monoidal method `merge` dealing with merging multiple streams.
See the paper by [Conal Elliot, "Push-Pull Functional Reactive Programming"](http://conal.net/papers/push-pull-frp/push-pull-frp.pdf).


### Lazy or eager?
The lazy vs eager functionality is already built in the function design:
```js
const cpsFun = input => callback => doSomeWork(callback)
// lazy - waiting to be called
cpsFun(input)
// eager - running with the callback passed
cpsFun(input)(callback)
```
Both are of course just functions and function calls, and can be used depending on the need.


### Differences with Haskell
Functional Programming in JavaScript has been largely influenced by Haskell.
However, there are fundamental design differences with Haskell:

#### JavaScript functions are by design not required to be [pure](https://en.wikipedia.org/wiki/Pure_function)

While one can always restrict to pure functions only, the available design allows to treat all functions uniformly, including non-pure ones. That provides considerable additional power at no extra cost. As a basic example, consider non-pure function mutating a variable
```js
var a = 0
const f = x => {
  x = x + a
}
```
that can be (pre-)composed with any other function `g`:
```js
const g => y => y * 2
const composed = y => f(g(x))
// or equivalently in functional way
const compose = (f,g) => x => f(g(x))
const composed = compose(f,g)
```
The `compose` operator is defined in uniform fashion and thus allows to compose arbitrary non-pure funcitons without any extra cost.



#### JavaScript functions are by design accepting arbitrary number of arguments

Again, one can always restrict to single argument, but that way considerable additional power provided by the language design is lost. For instance, object methods (that in JavaScript are treated as regular functions) are often defined with no parameters. As basic example consider adding results of two separate computations:
```js
const f1 = x => someComputation1(x)
const f2 = y => someComputation2(y)
const add = (a, b) => a + b
// binary addition is (pre-)composed with both f1, f2
const result = (x, y) => add(f1(x), f2(y))
```
Defining such abstract composition operator is straightforward:
```js
const binaryCompose => (h, f1, f2) => (x, y) => h(f1(x), f2(y))
const result = binaryCompose(add, f1, f2)
```
However, all 3 parameters `h, f1, f2` are mixed inside the signature, despite of their different roles. It is difficult to remember which function goes where and easy to introduce errors. A more readable and expressive way would be to use the curried signature:
```js
const binaryCompose1 => h => (f1, f2) => (x, y) => h(f1(x), f2(y))
const result = binaryCompose1(add)(f1, f2)
```
Now the inside functions `f1, f2` are visibly separated from the outside `h`.
The logic is much cleaner, probability of errors is lower and function is easier to test and debug. Such convenient separation between groups of functional parameters is easier in JavaScript than e.g. in Haskell with no distinction between curried and uncurried parameters.


### "Do less" is a feature
The proposed CPS desing API is minimal and focused on doing just one thing --
*a style to write and combine plain JavaScript funcitons with callbacks*.


## Terminology
A *Continuation-Passing-Style (CPS) function* is any function
```js
const cps = (f1, f2, ...) => { 
  /* f1, f2, ... are called arbitrarily often with any number of arguments */ 
}
```
that expects to be called with zero or several functions as arguments.
By *expects* we mean that this library and the following discussion 
only applies when functions are passed.
In a strictly typed language that would mean those arguments are required to be functions.
However, in JavaScript, where it is possible to pass any argument,
we don't aim to force errors when some arguments passed are not functions
and let the standard JavaScript engine deal with it the usual way,
as per [garbage in, garbage out (GIGO)](https://en.wikipedia.org/wiki/Garbage_in,_garbage_out) principle.

We also call the argument functions `f1, f2, ...` "callbacks"
due to the way how they are used.
Each of the callbacks can be called arbitrarily many times or never,
with zero to many arguments each time.
The number of arguments inside each callback 
can change from call to call and is even allowed to unlimitedly grow,
e.g. `n`th call may involve passing `n` arguments. 

By a *parametrized CPS function* we mean any curried function with zero or more parameters 
that returns a CPS function:
```js
const paramCps = (param1, param2, ...) => (f1, f2, ...) => { ... }
```

We shall adopt somewhat loose terminology calling *parametrized CPS functions* both
the curried function `paramCps` and its return value `paramCps(params)`,
in the hope that the context will make clear the precisce meaning.
In the same vein, by a *function call* of the parametrized CPS function,
we mean its call with both arguments and callbacks passed:
```js
paramCps(...args)(...callbacks)
```
Otherwise `parmCps(...args)` is considered a *partial call*.


## Using CPS functions
Using CPS functions is as simple as using JavaScript Promises:
```js
// Set up database query as parametrized CPS function with 2 callbacks,
// one for the result and one for the error
const cpsQuery = query => (resBack, errBack) => 
  // assuming Node style callback with error param first
  queryDb(query, (err, res) => err 
    ? resBack(res) 
    : errBack(err))
// Now just call as regular curried function
cpsQuery({name: 'Jane'})(
  result => console.log("Your Query returned: ", result), 
  error => console.error("Sorry, here is what happened: ", error)
)
```
The latter is very similar to how Promises are used:
```js
promiseQuery({name: 'Jane'}).then(
  result => console.log("Your query returned: ", result), 
  error => console.error("Sorry, an error happened: ", error)
)
```
Except that, calling `then` method is replaced by plain function call
and arbitrary number of callbacks is allowed,
each of which can be called arbitrary many times,
as e.g. in the event streams.
A Promise is essentially a CPS function with its first event cached,
that can be implemented by chaining (via [`chain`](#cpschain), see below) any CPS function
with the one picking and caching the first output from any callback.


## What about Callback Hell?
There is an actual website called [*Callback Hell*](http://callbackhell.com/).
The following callback hell example is shown:
```js
fs.readdir(source, function (err, files) {
  if (err) {
    console.log('Error finding files: ' + err)
  } else {
    files.forEach(function (filename, fileIndex) {
      console.log(filename)
      gm(source + filename).size(function (err, values) {
        if (err) {
          console.log('Error identifying file size: ' + err)
        } else {
          console.log(filename + ' : ' + values)
          aspect = (values.width / values.height)
          widths.forEach(function (width, widthIndex) {
            height = Math.round(width / aspect)
            console.log('resizing ' + filename + 'to ' + height + 'x' + height)
            this.resize(width, height).write(dest + 'w' + width + '_' + filename, function(err) {
              if (err) console.log('Error writing file: ' + err)
            })
          }.bind(this))
        }
      })
    })
  }
})
```

The solution proposed there to avoid this "hell" consists of splitting into mulitple functions and giving names to each.
However, naming is hard and
[is not always recommended](https://www.cs.ucf.edu/~dcm/Teaching/COT4810-Fall%202012/Literature/Backus.pdf).


Using CPS functions along with `map` and `chain` operators,
we can break that code into a sequence of small functions, chained one after another
without the need to name them:
```js
// wrap into `CPS` object to have `map` and `chain` methods available,
// directory files are passed as 2nd argument to cb, error as 1st
CPS(cb => fs.readdir(source, cb))
  // chain method passes instead the same 1st and 2nd arguments into the new CPS function
  .chain((err, files) => cb => 
    // only files are passed to the callback, whereas error produces no continuation
    err ? console.log('Error finding files: ' + err) : cb(files)
  )
  // chain modifies the CPS by passing `files`` from inside `cb` into the next CPS function instead
  .chain(files => cb => files.forEach((filename, fileIndex) => {
      console.log(filename)
      // make use of the multiple outputs passed to `cb` for each file
      // simply add `filename` to the optput inside `cb` to be consumed later
      gm(source + filename).size((err, values) => cb(err, values, filename))
    }))
  // now again chain accepts CPS function with the same 3 arguments as previously passed to `cb`
  .chain((err, values, filename) => cb => 
    err ? console.log('Error identifying file size: ' + err) : cb(values, filename)
  )
  // now we have `values` and `filename` as we need
  .chain((values, filename) => cb => {
    console.log(filename + ' : ' + values)
    aspect = (values.width / values.height)
    // as before, simply pass to callback `cb`
    // and handle all outputs in the next `chain` function
    widths.forEach(cb)
  })
  // now that we have called `cb` multiple times, each time chain passes new values to its CPS function
  .chain((width, widthIndex) => cb => {
    height = Math.round(width / aspect)
    console.log('resizing ' + filename + 'to ' + height + 'x' + height)
    this.resize(width, height).write(dest + 'w' + width + '_' + filename, cb)
  }.bind(this))
  // finally errors are handled via map method
  .map(err => err ? console.log('Error writing file: ' + err) : '')

```

Equivalently, we can use the `pipeline` operator (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Pipeline_operator) to achieve the same result
in more functional (aka point-free) style:

```js
pipeline( cb => fs.readdir(source, cb) ) (
  chain( (err, files) => cb => ... ),
  chain( files => cb => files.forEach((filename, fileIndex) => ... ) ),
  chain( (err, values, filename) => cb => ... ),
  chain( (values, filename) => cb => ... ),
  chain( (width, widthIndex) => cb => ... ),
  map( err => err ? console.log('Error writing file: ' + err) : '' ),
)
```

In the latter pattern there is no wrapper around the first CPS function,
it is simply passed around through all the transformations in the sequence.

Any such sequence of computations can be similaly achieved with just two operators - `map` and `chain`.
In fact, just the single more powerful `chain` is enough, as e.g. the following are equivalent:

```js
CPS(cpsFun).map((x, y) => f(x, y))
CPS(cpsFun).chain((x, y) => cb => cb(f(x, y)))
```

or, equivalently, using the `pipeline` operator

```js
pipeline(cpsFun)( map((x, y) => f(x, y)) )
pipeline(cpsFun)( chain((x, y) => cb => cb(f(x, y)) )
```

A limitation of the `chain` is its sequential nature.
To run computations in parallel, the `ap` (aka `apply`) operator
is more suitable, see below.


## Asynchronous iteration over array
On of the functions in the above example illustrates 
how multiple outputs fit nicely in the asynchronous iteration pattern:

```js
const jobCps = files => cb => files.forEach((filename, fileIndex) => {
  console.log(filename)
  gm(source + filename).size((err, values) => cb(err, values, filename))
})
```

Here we create the `jobCps` function that accepts callback
and calls it repeatedly for each `file`.
That wouldn't work with Promises that can only hold single value each,
so you would need to create as many Promises as the number of elements in the `file` array.
Instead, we have a single CPS function as above to hold all the asynchronous outputs for all files!



# Examples of CPS functions

## Promise producers
Any producer (aka executor) function

```js
const producer = function(resolve, reject) {
  // some work ...
  if (everythingIsOk) resolve(result)
  else reject(error) 
}
```

as one typically passed to the [Promise constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) is an example of a CPS function. 

The constructed promise `new Promise(producer)` only keeps the very first call of either of the callbacks,
whereas the producer function itself may call its callbacks multiple times,
each of which would be fully retained as output when CPS functions are used instead of Promises.

## Promises
Any JavaScript Promise generates a CPS function via its `.then` method
that completely captures the information held by the Promise:

```js
const cpsFromPromise = (onFulfilled, onRejected) => 
  promise.then(onFulfilled, onRejected)
```

The important restictions Promises arising that way are:
1. Among many callbacks passed, at most one is ever called.
2. Each of the callbacks is called precisely with one argument.
CPS functions do not have such limitations.

As any Promise provides a CPS function via its `then` method with two callbacks,
it can be dropped direclty into any CPS operator:

```js
CPS(cpsFun)
  .chain((x, y) => somePromise(x, y).then)(
    res => console.log("Result is: ", res),
    err => console.err("Something bad happened: ", err)
  )
```

Here `(x, y)` is the first output from `cpsFun` (the one passed into the first callback).
Now every such output will be passed into `somePromise` via [`chain`](#cpschain),
that will subsequently pass its result or error into the final callbacks
that are attached via plain function call.
And even better, the error callbacks will also receive 
all error outputs from `cpsFun`, basically whatever is passed into its second callback.
The outputs from both functions are simply merged together, 
due to the "flattening" job performed by the `chain`.

Conversely, any CPS function, being just a function accepting callbacks as its arguments, 
can be dropped into the Promise constructor 
(from any Promise implementation) to return the Promise 
holding the first argument from the first output as its resolved value,
while that from the second callback as error.


## Node API
Any Node-Style function with one of more callbacks can be curried into a parametrized CPS function:

```js
const readFileCPS = (path, options) => callback => fs.readFile(path, options, callback)
```

Here `readFileCPS` returns a CPS function for each values of its parameters 
`(path, options)`.

Typically Node API callbacks are called with at least two arguments as 
`callback(error, arg1, ...)`,
where the first argument is used as indication of error. 
CPS functions generalize this case to arbitrary number of callbacks 
accepting arbitrary number of arguments each.


## HTTP requests
In a similar vein, any HTTP request with callback(s) can be regarded as parametrized CPS function:
```js
const request = require('request')
// the CPS function is just the curried version
const requestCps = options => callback => http.request(options, callback)
```

Now `requestCps` is can be composed with any function computing its `options` object, and the output arguments passed to `callback` can be mapped over any function or chained with any other CPS function:
```js
const customRequest = pipe (
  prepareReqObject,
  requestCps,
  // args from callback passed to function inside chain
  chain((err, res, body) => (resCallback, errCallback) => doWork(...))
)
```

Or using the [native Node `https.request`](https://nodejs.org/api/https.html#https_https_request_options_callback):
```js
const https = require('https')
const httpsReqCps = (url, options) => cb => http.request(url, options, cb)
```
and turning data events to plain CPS function outputs:
```js
const dataStreamCps = pipe (
  httpsReqCps,
  // attach `cb` as even listener
  chain(response => cb => response.on('data', cb)),
  // and handle the data in the next CPS function
  chain(dataChunk => cb => cb(someTransformation(dataChunk)))
)
```

## Database Access
Any async database access API with callbacks can be curried into parametrized CPS functions:

```js
const queryDb = (db, query) => callback => getQuery(db, query, callback)
const insertDb = (db, data) => callback => inserData(db, data, callback)
```

In most cases each of these is considered a single request resulting in either success of failure.
However, more general CPS functions can implement more powerful functionality with multiple callback calls.
For instance, a function can run multiple data insetion attempts with progress reported back to client.
Or the query function can return its result in multiple chunks, each with a separate callback call. Or even subscribe to changes and update client in real time.
Further, the database query funtion can hold a state that is advanced with each call.
Similarly, any database access can be cancelled by subsequent call of the same CPS function with suitable parameters. 

## Middleware e.g. in Express or Redux
The [Express Framework](https://expressjs.com/) in NodeJs popularised
the concept of [middleware](https://expressjs.com/en/guide/writing-middleware.html)
that later found its place in other frameworks such as 
[Redux](https://redux.js.org/advanced/middleware#understanding-middleware).
In each case, a *middleware* is a special kind of function,
plain in case of Express and curried in case of Redux,
which has one continuation callback among its parameters.
To each middleware in each of these frameworks, 
there is the associated parametrized CPS function,
obtained by switching parameters and (un)currying.
As the correspondence `middleware <-> CPS function` goes in both ways,
it allows for each side to benefit from the other.


## Web Sockets
Here is a generic CPS function parametrized by its url `path`:
```js
const WebSocket = require('ws')
const createWS = path => callback => 
  new WebSocket(path).on('message', callback)
```

The callback will be called repeatedly with every new socket message emited.

Other websocket events can be subscribed by other callbacks,
so that a single CPS function with its multiple callbacks
can encapsulate the entire socket functionality.


## Stream libraries

### Pull Streams
The [Pull Streams](https://pull-stream.github.io/)
present an ingenious way of implementing 
a rich on-demand stream functionality,
including back pressure,
entirely with plain JavaScript functions.
In a way, they gave some of the original inspirations
for the general CPS function pattern.

Indeed, a Pull Stream is essentially a function `f(abort, callback)` that is called repeatedly
by the sink to produce on-demand stream of data.
Any such function can be clearly curried into a
is a parametrized CPS function
```js
const pullStream = params => callback => {...}
```

### [Flyd](https://github.com/paldepind/flyd)
Any `flyd` stream can be wrapped into a CPS function with single callback called with single argument:
```js
const cpsFun = callback => flydStream
  .map(x => callback(x))
```
The resulting CPS function `cpsFun`, when called with any `callback`,
simply subsribes that callback to the stream events.

Conversely, any CPS function `cpsFun` can be simply called with
any `flyd` stream in place of one of its callback arguments:
```js
let x = flyd.stream()
cpsFun(x)
```
That will push the first argument of any callback call of `x` into the stream.


## Event aggregation
Similarly to [`flyd` streams](https://github.com/paldepind/flyd/#creating-streams),
CPS functions can subscribe their callbacks to any event listener:
```js
const cpsFun = callback =>
  document.getElementById('button')
    .addEventListener('click', callback)
```
Furthermore, more complex CPS functions can similarly subscribe to 
muiltiple events:
```js
const cpsFun = (cb1, cb2) => {
  document.getElementById('button1')
    .addEventListener('click', cb1)
  document.getElementById('button2')
    .addEventListener('click', cb2)
}
```
and thereby serve as functional event aggregators
encapsulating multiple events.
Every time any of the event is emitted,
the corresponding callback will fire
with entire event data passed as arguments.
That way complete information from multiple events
remains accessible via single CPS function. 



# Comparison with Promises and Callbacks

Our main motivation for dealing with CPS functions is to enhance
the power of common coding patterns of 
callback functions, promises, streams etc. into a *single unified abstraction*,
which can capture the advantages typically regarded as ones of promises over callbacks.

In the [introductory section on promises](http://exploringjs.com/es6/ch_promises.html#sec_introduction-promises) of his wonderful book
[Exploring ES6](http://exploringjs.com/es6/),
[Dr. Axel Rauschmayer](http://dr-axel.de/) collected a list of 
advantages of promises over callbacks,
that we would like to consider here in the light of CPS functions
and explain how, in our view, the latters enjoy the same advantages,
while allowing for more power and flexibility.


## Returning results
> No inversion of control: 
> similarly to synchronous code, Promise-based functions return results, 
> they don’t (directly) continue – and control – execution via callbacks. 
> That is, the caller stays in control.

We regard CPS functions returning their output in similar fashion as promises, 
via the arguments passed to each callback call, while CPS functions allow for any number of arguments rather than only one like with promises.
Recall that the result inside a promise can only be extracted via callback,
which is essentially the same as passing callback to a CPS function:
```js
// pass callbacks to promise
const promise.then(cb1, cb2) 
// => result is delivered via cb1(result)
```
as compared to simpler CPS syntax without `.then`:
```js
// pass callbacks to CPS function
const cps(f1, f2)
// => a tuple (vector) of results is deliverd via f1(res1, res2, ...)
```
Also, comparing to promises, CPS functions are allowed to have multiple outputs by calling their callbacks with multiple values multiple times, rather than with single value single time.
As no `.then` method is needed, the CPS function syntax is shorter being
a plain function call (with no "magic" running upon evaluation such as 
unwrapping theneables).


## Chaining
> Chaining is simpler: 
> If the callback of `then()` returns a Promise 
> (e.g. the result of calling another Promise-based function) 
> then `then()` returns that Promise 
> (how this really works is more complicated and explained later). 
> As a consequence, you can chain then() method calls: 
>```js
>asyncFunction1(a, b)
>  .then(result1 => {
>      console.log(result1);
>      return asyncFunction2(x, y);
>  })
>  .then(result2 => {
>      console.log(result2);
>  });
>```

In our view, the complexity of chaing for the callbacks is merely due to the lacking convenience methods for doing it.
On a basic level, promise wraps its CPS function `f(onFulfilled, onError)` into an object providing such methods.
However, the Promise constructor also adds limitations on the functionality and generally does a lot more, sometimes at the cost of performance.
On the other hand, to have similar chaining methods, much less powerful methods are needed,
that can be uniformly provided for general CPS functions. 
The above example can then be generalized to arbitrary CPS functions:
```js
// wrapper providing methods
CPS(cpsFunction1(a, b))
  // 'chain' (aka 'flatMap') is used to compose parametrized CPS functions
  .chain(result1 => {
      console.log(result1);
      return cpsFunction2(x, y);
  })
  // 'map' is used to compose CPS outputs with ordinary functions
  .map(result2 => {
      console.log(result2);
  });
```
Here `CPS(...)` is a lightweight object wrapper 
providing the `.map` and `.chain` methods among others,
where `CPS.of` and `map` together conform to the [Pointed Functor](https://stackoverflow.com/questions/39179830/how-to-use-pointed-functor-properly/41816326#41816326) and `CPS.of` together
with `CPS.chain` to the [Monadic](https://github.com/rpominov/static-land/blob/master/docs/spec.md#monad) [interface](https://github.com/fantasyland/fantasy-land#monad).
At the same time, the full functional structure is preserved allowing 
for drop-in replacement
`cpsFun` with `CPS(cpsFun)`,
because as function `CPS(cpsFun)` delegates to `cpsFun`,
e.g. `CPS(cpsFun)(callback)` is equivalent to `cpsFun(callback)`.


## Asynchronous composition
> Composing asynchronous calls (loops, mapping, etc.): 
> is a little easier, because you have data 
> (Promise objects) you can work with.

Similar to promises wrapping their data, 
we regard CPS functions as wrapping the outputs of their callbacks
(plus multiple outputs are allowed).
Whenever methods are needed, CPS functions can be explicitly wrapped into 
its CPS object via the `CPS` factory, 
similar to how the `Promise` constructor wraps its producer function,
except that `CPS` does nothing else.
There is no recursive unwrapping of "thenables" inside `CPS` factory as in the Promise constructor.

In addition, the CPS object `CPS(cpsFunction)` retains the same information
by delivering the same functionality via direct function calls with the same callbacks!
That is, the following calls are equivalent: 
```js
cpsFunction(cb1, cb2, ...)
CPS(cpsFunction)(cb1, cb2, ...)
```
That means, the wrapped CPS function can be dropped directly into the same code
preserving all the functionality with no change!

In regard of composing asynchronous calls, 
with CPS functions it can be as simple as in the above example.


## Error handling
> Error handling: As we shall see later, 
> error handling is simpler with Promises, because, once again, 
> there isn’t an inversion of control. 
> Furthermore, both exceptions and asynchronous errors 
> are managed the same way.

In regards of error handling, 
the following paragraph in here http://exploringjs.com/es6/ch_promises.html#_chaining-and-errors
seems relevant:

> There can be one or more then() method calls that don’t have error handlers.
> Then the error is passed on until there is an error handler.
>```js
>asyncFunc1()
>.then(asyncFunc2)
>.then(asyncFunc3)
>.catch(function (reason) {
>   // Something went wrong above
>});
>```

And here is the same example with CPS functions:
```js
CPS(cpsFunc1)
.chain(cpsFunc2)
.chain(cpsFunc3)
.map(null, reason => {
    // Something went wrong above
});
```
Here the `map` method is used with two arguments
and the second callback considered as holding errors,
in the same way as the Promises achieve that effect.

There is, however, no a priori restriction for the error callback
to be the second argument, it can also be the first callback
as in [Fluture](https://github.com/fluture-js/Fluture) or Folktale's [`Data.Task`](https://github.com/folktale/data.task), or the last one, or anywhere inbetween.

Similar to Promises, also for CPS functions, handling 
both exceptions and asynchronous errors can be managed the same uniform way.
Or the multiple callbacks feature of CPS functions can be utilized
to handle errors of different nature in different callbacks,
such as for instance [Fun-Task does](https://github.com/rpominov/fun-task/blob/master/docs/exceptions.md).

On the other hand, in contrast to Promises, 
the CPS functions allow for clean separation between exceptions such as bugs 
that need to be caught as early as possible, and asynchronous errors 
that are expected and returned via the error callbacks calls.
The absence of similar feature for Promises attracted [considerable criticisms](https://medium.com/@avaq/broken-promises-2ae92780f33).


## Functional signatures
> Cleaner signatures: With callbacks, the parameters of a function are mixed; some are input for the function, others are responsible for delivering its output. With Promises, function signatures become cleaner; all parameters are input.

The "curried nature" of the (parametrized) CPS functions 
ensures clean separation between their input parameters
and the callbacks that are used to hold the output only:
```js
const paramCps = (param1, param2, ...) => (cb1, cb2, ...) => { ... }
```
Here the output holding callbacks `cb1, cb2, ...` are 
cleanly "curried away" from the input parameters `param1, param2, ...`.

Note that, without currying, it would not be possible to achieve similar separation.
If function is called directly without currying, it is impossible to tell
which arguments are meant for input and which for output.

The principle here is very analogous to how that separation is achieved by Promises,
except that the CPS function do not impose any restricitons on the 
number of their callback calls, nor the number of arguments passed to each callback
with each call.


## Standardization
> Standardized: Prior to Promises, there were several incompatible ways 
> of handling asynchronous results 
> (Node.js callbacks, XMLHttpRequest, IndexedDB, etc.). 
> With Promises, there is a clearly defined standard: 
> ECMAScript 6. ES6 follows the standard Promises/A+. 
> Since ES6, an increasing number of APIs is based on Promises.

The CPS functions build directly on the standard already established for JavaScript functions.
The provided methods such as `of` (aka `pure`, `return`), `map` (aka `fmap`), `chain` (aka `flatMap`, `bind`) strictly follow the general standards for algebraic data types established by Functional Programming languages and Category Theory.




# Functional and Fluent API

The `CPS` function transforms any CPS function into that very same CPS function, 
to which in addition all API methods can be applied.
The same methods are provided on the `CPS` namespace and
can be applied directly to CPS functions with the same effect.
For instance, the following expressions are equivalent ([in the sense of fantasyland](https://github.com/fantasyland/fantasy-land#terminology)):
```js
CPS(cpsFun).map(f)
map(f)(cpsFun)
map(f, cpsFun)
```
Note that the functional style let us simply drop in CPS functions as plain functions,
whereas to use `map` as method we need to wrap them into `CPS()` first.

And the equivalent multiple argument versions are:
```js
CPS(cpsFun).map(f1, f2, ...)
map(f1, f2, ...)(cpsFun)
map(f1, f2, ..., cpsFun)
```
In the last expression, only the last argument is a CPS function,
whereas all other arguments are arbitrary functions
acting by means of their return values.


## Conventions
In the following we slightly abuse the notation by placing methods directly
on the CPS functions, where the meaning is always after wrapping the functions into `CPS`.
That is, we write 
```js
cpsFun.map(f)
// instead of 
CPS(cpsFun).map(f)
```
We could have used instead the equivalent functional style `map(f)(cpsFun)`,
but the fluent style seems more common in JavaScript and closer to how Promises are used,
so we use it instead.


## CPS.map
The `map` method and the equivalent `CPS.map` function in their simplest form 
are similar to `Array.map` as well as other `map` functions/methods used in JavaScript.

### Mapping over single function
In the simplest case of a single function `x => f(x)` with one argument,
the corresponding transformation of the CPS function only affects the first callback,
very similar to how the function inside `.then` method of a Promise only affects the fulfilled value:
```js
const newPromise = oldPromise.then(f)
```

Except that the `map` behavior is simpler with no complex promise recognition nor any thenable unwrapping:
```js
const newCps = CPS(oldCps).map(f)
// or equivalently in point-free functional style
const newCps = map(f)(oldCps)
// or equivalently using pipeline
const newCps = pipeline(oldCps)(map(f))
```
The `newCps` function will call its first callback
with the single transformed value `f(res)`,
whereas the functionality of the other callbacks remains unchanged.

Also the return value of CPS function always remains unchanged after transforming with any `map` invocation, e.g. `newCps` above returns the same value as `oldCps`.


The last two expressions have the advantage that no wrapping into `CPS()` is needed. The `pipeline` version in addition corresponds to the natural flow - get `oldCps` first, then pass to the transformer. This advantage appears even more visible with anonymous functions:
```js
// outputting 2-tuple of values
const newCps = pipeline(x => cb => cb(x+1, x+2))(
  // the 2-tuple is passed as args to function inside `map`
  map((val1, val2) => val1 * val2)
)
// or equivalently using the `.map` method via CPS wrapper
const newCps = CPS(x => cb => cb(x+1, x+2))
  .map((val1, val2) => val1 * val2)
// to compare with point-free style
const newCps = map((val1, val2) => val1 * val2)(
  x => cb => cb(x+1, x+2)
)
```


### Mapping over multiple functions

As `map(f)` is itself a function, its JavaScript signature provides us with the power to pass to it arbitrary number of arguments: `map(f1, f2, ...)`. This added power appear very handy for CPS functions with multiple outputs via multiple callbacks, where we can apply the `n`th function `fn` to transform the output of the `n`th callback:
```js
const newCps = CPS(oldCps).map(res => f(res), err => g(err))
// or simply
const newCps = CPS(oldCps).map(f, g)
// or equivalently in point-free style
const newCps = map(f, g)(oldCps)
// or with pipeline
const newCps = pipeline(oldCps)(map(f,g))
```

Here we are calling the second result `err` in analogy with promises,
however, in general, it can be any callback without extra meaning.
The resulting CPS function will call its first and second callbacks
with correspondingly transformed arguments `f(res)` and `g(res)`,
whereas all other callbacks will be passed from `newCps` to `oldCps` unchanged.

The latter property generalizes the praised feature of Promises,
where a single error handler can deal with all accumulated errors.
In our case, the same behavior occurs for the `n`th callback
that will be picked by only those `map` invocations holding functions at their `n`th spot.
For instance, a possible third callback `progress` 
will similaly be handled only invocations of `map(f1, f2, f3)`
with some `f3` provided.


### Map taking arbitrarily many functions with arbitrary numbers of arguments
In most general case, `map` applies its argument functions to several arguments passed at once to corresponding callbacks:
```js
const oldCps = x => (cb1, cb2, cb3) => {
  cb1(vals1); cb2(vals2); cb3(vals3)
}
// now vals1 are tranformed with f1, vals2 with f2, vals3 with f3
const newCps = CPS(oldCps).map(f1, f2, f3)
```

That means, the pattern can be generalized to
```js
const newCps = CPS(oldCps).map((res1, res2, ...) => f(res1, res2, ...))
```
or passing arbitrary number of arguments with [rest parameters syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters):
```js
const newCps = CPS(oldCps).map((...args) => f(...args))
// which is the same as
const newCps = CPS(oldCps).map(f)
```
or passing only some of the arguments:
```js
const newCps = CPS(oldCps)
  .map((iAmThrownAway, ...rest) => f(...rest))
```
or picking props from multiple objects selectively via destructuring:
```js
const newCps = CPS(oldCps)
  // select only important props and transform as 2-tuple
  .map(({name: name1}, {name: name2}) => f(name1, name2))
```
None of these transformations would be as convenient with Promises where only single values are ever being passed.


### Functor laws
The `map` method for single functions of single argument satisfies the functor laws.
That is, the following pairs of expressions are equivalent:
```js
cpsFun.map(f).map(g)
// and
cpsFun.map(x => g(f(x)))
```
as well as
```js
cpsFun
// and
cpsFun.map(x => x)
```

In fact, we have more general equivalences with multiple arguments:
```js
cpsFun.map(f1, f2, ...).map(g1, g2, ...)
// and
cpsFun.map(x1 => g1(f1(x1)), x2 => g2(f2(x2)), ...)
```
where in addition, the number of `f`'s can differ from the number of `g`'s,
in which case the missing maps are replaced by the identities.


### CPS.of
The static method `CPS.of` that we simply call `of` here
is the simplest way to wrap values into a CPS function:
```js
const of = (x1, x2, ...) => callback => callback(x1, x2, ...)
```
or equivalently
```js
const of = (...args) => callback => callback(...args)
```

Here the full tuple `(x1, x2, ...)` becomes a single output of
the created CPS function `of(x1, x2, ...)`.

As mentioned before, 
`of` and `map` for single functions with single argument 
conform to the [Pointed Functor](https://stackoverflow.com/questions/39179830/how-to-use-pointed-functor-properly/41816326#41816326),
that is the following expressions are equivalent:
```js
of(x).map(f)
of(f(x))
// both expressions are equivalent to
cb => cb(f(x))
```
In our case, the first expression maps `f` over the CPS function `cb => cb(x)` by transforming its single output `x`,
whereas the second one outputs `f(x)` direclty into its callback, which is obviously the same.

More generally, the following are still equivalent
with the same reasoning:
```js
of(x1, x2, ...).map(f)
// and
of(f(x1, x2, ...))
// are equivalent to
cb => cb(f(x1, x2, ...)) 
```


## CPS.chain

### Transforming multiple arguments into multiple arguments
There is a certain lack of symmetry with the `map` method,
due to the way functions are called with several arguments but 
only ever return a single value.

But what if we want not only to consume, but also to pass multiple arguments to the callback of the new CPS function?

No problem. Except that, we should wrap these into another CPS function and use `chain` instead:
```js
const newCps = CPS(oldCps)
  .chain((x1, x2, ...) => of(x1 + 1, x2 * 2))
// or explicitly
const newCps = CPS(oldCps)
  .chain((x1, x2, ...) => cb => cb(x1 + 1, x2 * 2))
```

Here we pass both `x1 + 1` and `x2 * 2` simultaneously into the callback `cb`.
Generalizing Promises that only hold one value, we can regard `(x1, x2, ...)` as tuple of values held inside single CPS function,
in fact, all being passed to only its first callback. 
Now the output values of `oldCps` are passed to the functions inside
 `chain`, get transformed it according to the second CPS function, 
i.e. into the pair `(x1 + 1, x2 * 2)`,
and finally passed to the first callback of `newCps`.
The final result is exactly the intended one, that is, 
the result tuple output `(x1, x2, ...)` from `oldCps`'s first callback is transformed into the new pair `(x1 + 1, x2 * 2)`
that becomes the output of `newCps`.


### Why is it called `chain`?
Have you noticed the difference between how `map` and `chain` are used?
Here is the simplest case comparison:
```js
cpsFun.map(x => x+1)
cpsFun.chain(x => of(x+1))
```
In the first expression the value `x+1` is passed directly,
in the second it is wrapped into CPS function with `of`.
The first time the return value of the function inside `map` is used,
the second time it is the output value of the CPS function inside `chain`.

The "Promised" way is very similar:
```js
promise.then(x => x+1)
promise.then(x => Promise.resolve(x+1))
```
Except that both times `then` is used,
so we don't have to choose between `map` and `chain`.
However, such simplicity comes with its cost.
Since `then` has to do its work to detect 
and recursively unwrap any Promise or in fact any ["thenable"](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve),
there can be loss in performance as well as 
in safety to refactor 
```js
promise.then(f).then(g)
```
to
```js
promise.then(x => g(f(x)))
```
which is [not always the same](https://stackoverflow.com/a/50173415/1614973).

On the other hand, our `map` method
conforms to the Functor composition law,
that is the following expressions are always equivalent
and safe to refactor to each other (as mentioned above):
```js
cpsFun.map(f).map(g)
// and
cpsFun.map(x => g(f(x)))
```
And since now no other work is involved,
performance wins.

However, if we try use `map` in the second case,
instead of `chain`, we get
```js
cpsFun.map(x => of(x+1))
```
which emits `of(x+1)` as output, rather than `x+1`.
That is, the output result of our CPS function is another CPS function,
so we get our value wrapped twice.
This is where `chain` becomes useful,
in that in removes one of the layers,
aka "flattens" the result,
which is why it is also called `flatMap`.

For CPS functions, the name `chain` is particularly descriptive
because it effectively chains two such functions
by passing the output of one funciton as input to the other.
And the rule becomes very simple:

*Use `map` with "plain" functions and `flatMap` with CPS functions inside*


### Composing multiple outputs
In the previous case we had `chain` over a CPS function with single output,
even when the output itself is a tuple.
In comparison, a general Promise has two outputs - the result and the error.
Of course, in case of Promises, there are more restrctions such as only one of these two
outputs can be emitted.

No such restrictions are iposed on CPS functions,
where two or more callbacks can receive arbitrary number of outputs arbitrarily often.
To keep things simple, consider how the Promise functionality can be extended
without the output exclusivity restriction:
```js
const cpsFun = (cb1, cb2) => {
  /* some work here... */
  cb1(res1)
  /* some more work... */
  cb2(res2)
}
```
So both callbacks are called with their individual results at different moments.

A very useful and realistic example of this functionality would be,
when the server sent an error but then eventually managed to deliver the data.
That would be impossible to implement with Promises.

Back to our example,
we now want to use the output for the next CPS computation:
```js
const newCps = cpsFun.chain(res => anotherCps(res))
```
We are now chaining aka sequentially executing `cpsFun`,
followed by the next parametrized CPS function
`anotherCps` applied to the result `res` of the previous computation.

So how should we combine both computations?
And should we apply the second one to `res1` or `res2`?

If you read the above description of the `map`, you know the answer.
The principle is the same. As we only pass one function to `chain`,
only the first callback is affected. 
That is, we must pass only the first result `res1` to `anotherCps`.
Whose output will be our final result inside the first callback,
whereas all other callbacks remain unchanged.

So the functionality of `newCps` is equivalent to the following:
```js
const newCps = (...args) => cpsFun(
  res1 => anotherCps(res1)(...args), 
  res2 => cb2(args[1])
)
```
Note how all callbacks are passed to the inner CPS function in the same order as `args`.
That guarantees that no outgoing information from `anotherCps` can ever get lost.


### Passing multiple CPS functions to `chain`

Similarly to `map`, also `chain` accepts arbitrary number of functins, 
this time CPS functions:
```js
const newCps = oldCps.chain(
  res1 => anotherCps1(res1), 
  res2 => anotherCps2(res2), 
    ...
)
```
Look how similar it is with Promises usage:
```js
// Promises
promise.then(
  res => anotherPromise(res),
  error => errorHandlerPromise(err) 
)
// CPS functions
cpsFun.chain(
  res => anotherCps(res),
  err => errorHandlerCps(err) 
)
```
You can barely tell the difference, can you?

Or, since the CPS functions are just functions, 
we can even drop any Promise `then` function directly into `chain`:
```js
// CPS functions
cpsFun.chain(
  res => anotherPromise.then(res),
  error => errorHandlerPromise.then(err)
)
// or just the shorter
cpsFun.chain( anotherPromise.then, errorHandlerPromise.then )
```

On the other hand, the CPS functions are more powerful
in that they can call their callbacks multiple times in the future,
with the potential of passing further important information back to the caller.
Also we don't want to prescribe in which callback the error should go,
treating all the callbacks in a uniform way.
Here is some pseudocode demonstrating general usage of `chain`
with mulitple functions:
```js
const newCps = oldCps.chain(
  (x1, x2, ...) => cpsFun1(x1, x2, ...),
  (y1, y2, ...) => cpsFun2(y1, y2, ...),
    ...
)
```
And the functionality of `newCps` is equivalent to
```js
const newCps = (cb1, cb2, ...) => oldCps(
  (x1, x2, ...) => cpsFun1(x1, x2, ...)(cb1, cb2, ...)
  (y1, y2, ...) => cpsFun1(y1, y2, ...)(cb1, cb2, ...)
    ...
)
```
As any other CPS function, our `newCps` accepts arbitrary number of callbacks
that are simply all passed to each interior CPS function in the same order.
That leads to the effect of capturing output events from each of them,
and "flattening" the event streams via simple merging.


### Monadic laws
When used with single callback argument,
`of` and `chain` satisfy the regular monadic laws.

#### Associativity law
The associativity law analogue for Promises would be the equivalence of
```js
promise
  .then(x1 => promise1(x1))
  .then(x2 => promise2(x2))
// and
promise
  .then(x1 => promise1.then(x2 => promise2(x2)))
```
which [are, however, not always equivalent](https://stackoverflow.com/a/50173415/1614973).


For CPS functions in contrast, we do indeed obtain true equivalence of
```js
cpsFun
  .chain(x1 => cpsFun1(x1))
  .chain(x2 => cpsFun2(x2))
// and
cpsFun
  .chain(x1 => cpsFun1.chain(x2 => cpsFun2(x2)))
```
Because, since these are just functions, 
both expressions can be direclty expanded into
```js
cb => cpsFun(
  x1 => cpsFun1(x1)(
    x2 => cpsFun2(x2)(cb)
  )
)
```
That is, the output `x1` of `cpsFun` is passed to `cpsFun1`,
which transforms it into `x2` as output, 
subsequently passed to `cpsFun2`,
whose output is finally diverted direclty into `cb`.

More generally, similar law still holds for mulitple arguments,
that is the following are equivalent
```js
cpsFun
  .chain(f1, f2, ...)
  .chain(g1, g2, ...)
// and
cpsFun
  .chain(
    (...xs) => f1(...xs).chain((...ys) => g1(...ys)),
    (...xs) => f2(...xs).chain((...ys) => g2(...ys)),
      ...
  )
```
as both expand into
```js
(...cbs) => cpsFun(
  (...xs) => f1(...xs)((...ys) => g1(...ys)(...cbs)),
  (...xs) => f2(...xs)((...ys) => g2(...ys)(...cbs)),
    ...
)
```

#### Identity laws
The monadic identity laws asserts that both following 
expressions are equivalent to the CPS function `cpsFun`:
```js
cpsFun
// and
chain(y => of(y))(cpsFun)
```
Here `cpsFun` is any CPS function,
whose output is composed with the CPS identity `y => of(y)`.


On the other hand, taking a parametrized CPS function 
`x => cpsFun(x)` and moving the identity to other side,
we get the other law asserting the equivalence of:
```js
x => cpsF(x)
// is equivalent to
x => chain(
  y => cpsF(y)
)(
  cb => cb(x)
)
```

Once expanded, both equivalences are 
became straightforward to check.
More interestingly, they still hold for multiple arguments:
```js
cpsFun
// is equivalent to
cpsFun.chain(
  (...ys) => of(...ys),
  (...ys) => of(...ys),
    ... /* any number of identities */
)
```
and the other way around:
```js
(...xs) => cpsF(...xs)
// is equivalent to
(...xs) => chain(
  (...ys) => cpsF(...ys))((...cbs) => cbs.map(cb => cb(...xs))
)
```


## Application of `chain`: Turn Node API into Promise style callbacks
The Node style callbacks with error argument first
force their errors to be handled each single time:
```js
someNodeFunction(param, callback((error, result) => {
  if (error) mustHandle...
  doMoreWork(result, callback((error, result) => {
    ...
  }))
}))
```
In constrast, Promises make it possible to handle all errors with one callback at the end:
```js
promise
  .then(doSomeWork)
  .then(doMoreWork)
    ...
  .catch(handleAllErrors)
```

Many libraries offering methods to "promisify" Node style callbacks.
The trouble is the [Gorilla-Banana Problem](https://www.johndcook.com/blog/2011/07/19/you-wanted-banana/): Promises added a lot of other functionality and limitations that not everyone needs.
For instance, it is perfectly legal to call callbacks muiltiple times
(for which there are many use cases such as streams and event handlers),
whereas the "promisification" would only see the first call.

On the other hand, we can curry any callback-last Node method into CPS function
```js
const cpsErrback = (...args) => cb => nodeApi(...args, cb)
```
and subsequently `chain` it into "Promise" style CPS function
with the same pair of callbacks, except that no other functionality is added nor removed:
```js
const promiseStyle = CPS(cpsErrback)
  .chain((error, ...results) => (resBack, errBack) => error 
    ? errBack(error) 
    : resBack(...results) 
  )
```

Now we can chain these CPS funcitons exactly like Promises,
passing only the first callback, and handle all errors at the end in the second callback.
```js
promiseStyle
  .chain(doSomeWork)
  .map(doMoreWork)
    ...
  .chain(null, handleAllErrors)

```



## CPS.ap (TODO)
The `ap` operator plays an important role when
*running functions in parallel* and combining their outputs.

### Running CPS functions in parallel
Similarly to `map(f)` applying a plain function `f` to (the output of) a CPS function,
`ap(cpsF)` applies functions that are themselves outputs of some CPS function,
delivered via callbacks. 
A simple example is getting result from a database query via `cpsDb` function
and display it with via function transformer obtained from an independent query:
```js
// returns result via 'cb(result)' call
const cpsDb = query => cb => getQuery(query, cb)
// returns transformer function via 'cb(transformer)'
const cpsTransformer = path => cb => getTransformer(path, cb)
// Now use the 'ap' operator to apply the transformer to the query result:
const getTransformedRes = (query, path) => 
  CPS(cpsDb(query)).ap(cpsTransformer(path))
// or equivalently in the functional style, without the need of the 'CPS' wrapper:
const getTransformedRes = (query, path) => 
  ap(cpsTransformer(path))(cpsDb(query))
```

Note that we could have used `map` and `chain` 
to run the same functions *sequentially*, one after another:
```js
(query, path) => CPS(cpsDb(query))
  .chain(result => cpsTransformer(path)
    .map(transformer => transformer(result)))
```
Here we have to nest, 
in order to keep `result` in the scope of the second function.
However, `result` from the first function was not needed 
to run the `cpsTransformer`,
so it was a waste of time and resources to wait for the query `result`
before getting the `transformer`.
It would be more efficient to run both functions in parallel 
and then combine the results,
which is precisely what the `ap` operator does.


### Lifting functions of multiple arguments
Perhaps the most important use of the `ap` operator is lifting plain functions
to act on results of CPS functional computations.
That way simple plain functions can be created and re-used
with arbitrary data, regardless of how the data are retrieved.
In the above example we have used the general purpose plain function
```js
const f =(result, transformer) => transformer(result)
```
which is, of course, just the ordinary function call.
That function was "lifted" to act on the data delivered as outputs
from separate CPS functions.

Since this use case is very common,
we have the convenience operator doing exactly that called `lift`:
```js
const getTransformedRes = (query, path) => 
  lift(transformer => transformer(result))
    (cpsDb(query), cpsTransformer(path))
```

#### Promise.all
The common way to run Promises in parallel via `Promise.all`
is a special case of the `lift` usage,
corresponding to lifting the function 
combining values in array:
```js
const combine = (...args) => args
Promise.all = promiseArray => lift(combine)(...promiseArray)
```

Similarly, the same `combine` function (or any other) can be lifted
over to act on outputs of CPS functions:
```js
(cpsF1, cpsF2, ...) => lift((x1, x2, ...) => f(x1, x2, ...))(cpsF1, cpsF2, ...)
```


#### Usage notes
Note that `lift` (and `ap`) are best used when 
their arguments can only be retrieved as outputs from separate CPS functions.
If for instance, both `result` and `transformer`
can be delivered via single query,
using `lift` would be a waste of its parallel execution functionality.
Instead we could have used the simple `map` with a single CPS function:
```js
const getTransformedResSingle = (query, path) =>
  CPS(getData(query, path)).map((result, transformer) => transformer(result))
```
Note how the `map` function is applied with two arguments,
which assumes the `getData` function to have these in a single callback output 
as `callback(result, transformer)`.


### Applying multiple functions inside `ap`

As with `map` and `chain`, the same rules apply for `ap`:
```js
const transformed = CPS(cpsFun).ap(F1, F2, ...)
```
When called with callbacks `(cb1, cb2, ...)`,
the output from `cb1` is transformed with the output function from `F1`,
the output from `cb2` with function from `F2` and so on.
The `trasformed` function will store the last value
from each output and only call its callbacks
when all needed data are available.

For instance, a CPS function with two callbacks such as `(resBack, errBack)`
can be `ap`-plied over a pair of CPS functions, 
outputting plain functions each:
```js
// These call some remote API
const cpsResTransformer = cb => getResTransformer(cb)
const cpsErrHandler = cb => getErrHandler(cb)
// This requires error handlers
const cpsValue = (resBack, errBack) => getValue(resBack, errBack)
// Now run all requests in parallel and consume both outputs as they arrive
// via plain function call
CPS(cpsValue).ap(cpsResTransformer, cpsErrHandler)(
  res => console.log("Transformed Result: ", res)
  err => console.log("The Error had been handled: ", err)
)
```

The above pattern can be very powerful,
for instance the `cpsErrHandler` function
can include a remote retry or cleanup service
that is now completely abstracted away from the main code pipeline!



### Applicative laws
The `ap` operator together with `of` conforms to the [Applicative interface](https://github.com/rpominov/static-land/blob/master/docs/spec.md#applicative).
However:

**Warning.** The `ap` operator runs all CPS functions *in parallel*. 
As such, it is different from its *sequential* analogue running functions
one after another. 
It is the latter - sequential applicative, that is [derived from monad's `chain`](https://github.com/rpominov/static-land/blob/master/docs/spec.md#chain) or via [Fantasy Land typeclasses](https://github.com/fantasyland/fantasy-land#derivations). Or in [Haskell](http://hackage.haskell.org/package/base-4.12.0.0/docs/Control-Monad.html).
Instead, we use the parallel `ap` as being more powerful as 
[explained above](#running-cps-functions-in-parallel).


## CPS.merge (TODO)
The `merge` operator merges outputs events from multiple CPS functions,
which occurs separately for each callback slot:
```js
// merge outputs into single CPS function
const cpsMerged = merge(cpsF1, cpsF2, ...)
// cb1 receives all outputs from the first callback of each of the cpsF1, cpsF2, ...
cpsMerged(cb1, cb2, ...)
```
Here the `N`-th callback of `cpsMerged` gets called each time
the `N`-th callback of any of the functions `cpsF1`, `cpsF2`, ...,
with the same arguments.
This behaviour corresponds to merging the values emitted by 
each event stream.

### Relation with Promise.race
The `merge` operator generalizes the functionality provided for Promises via `Promise.race`.
Since Promises only take the first emitted value from each output,
merging those results in the earliest value from all being picked by the Promise,
hence the direct analogy with `Promise.race`.

### Commutative Monoid
The `merge` operator makes the set of all CPS functions a commutative Monoid,
where the identity is played by the trivial CPS function that never emits any output.




## CPS.filter
The `filter` operator does the obvious thing,
that is trasform one CPS function into another by filtering the output.
As the output may have several arguments,
the filter function is also variadic:
```js
const cpsFiltered = filter(pred)(cpsFun)
```
Here `pred` is a Boolean function called for each output tuple.
The resulting `cpsFiltered` emits only the output for which `pred` returns `true`.


### Filtering over multiple functions
Consistently with other operators,
also `filter` accepts multiple predicate functions,
each matched against the ouput from the corresponding callback.

That is, the filtered function
```js
const cpsFiltered = filter(p1, p2, ...)(cpsFun)
```
when passed callbacks `(cb1, cb2, ...)`,
calls `cb1` with the same output `(x1, x2, ...)` as `cpsFun` does,
as long as `p1(x1, x2, ...)` returns `true`, otherwise the call is skipped.
Similarly, `p2` filters the output of `cb2` and so on.
The callbacks not corresponding to any predicate function
will be unaffected and the predicates corresponding to no callbacks 
are ignored.


### Implementation via `chain`
Filtering is really chaining:
```js
// pass through only input truthy `pred`
const cpsFilter = pred => (...input) => cb => {
  if (pred(...input)) cb(...input)
}
// now chain with `cpsFilter(pred)`:
const filter = pred => CPS(cpsFun)
  .chain(cpsFilter(pred))
```
And the variadic version reuses the same `cpsFilter` applied to each predicate:
```js
// call `chain` with the list of arguments, one per each predicate
const filter = (...pred) => CPS(cpsFun)
  .chain(...pred.map(cpsFilter))
// or using the `pipeline` operator
const filter = (...pred) => pipeline(cpsFun)( 
  chain(...pred.map(cpsFilter)) 
)
```




## CPS.scan
The `scan` operator acts as "partial reduce" for each output.
Important example is the stream of states affected by stream of actions:
```js
const cpsState = scan(f)(initState)(cpsAction)
```
Here `f` is the reducing function accepting current `state` and
the next `action` and returning the next state as `f(state, action)`, 
that is the signature is
```js
f :: (state, action) -> state
```

Similarly to `filter`, `scan` can also be derived from `chain`:
```js
const scan = f => state => cpsAction => pipeline(cpsAction)(
  // action may contain several arguments
  chain((...action) => cb => {
    state = f(state, ...action)
    cb(state)
  })
)
```
Note that the function inside `chain` updates the `state` outside its scope,
so it is not pure, however, we can still `chain` it like any other function.

And here is the mulitple arguments generalization:
```js
// `reducers` and `states` are matched together by index
const scan = (...reducers) => (...states) => {
  cpsAction => pipeline(cpsAction)(
    // chaining with multiple reducers, one per state
    chain(...states.map((, idx) => cb => {
      // accessing states and reducers by index
      cb( states[idx] = reducers[idx](states[idx], ...action) )
    })
  ))
}
```
