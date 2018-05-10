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
In the same vein, by a *function call* of the parametrized CPS function,
we mean its call with both parameters and callbacks passed.
Otherwise `parmCps(params)` is considered a *partial call*.



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
Any JavaScript promise generates a CPS function via its `.then` method invocation
that completely captures the information held by the promise:
```js
const cpsPromise = (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected)
```
The important restictions for functions arising that way are:
1. At most one callback function is called.
2. Each of the callback functions is called precisely with one argument.

The general CPS functions do assume such restrictions.


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
is essentially a function `f(abort, callback)` that is called repeatedly
by the sink to produce on-demand stream of data.
Any such function can be clearly curried into a
is a parametrized CPS function 
```js
const pullStream = params => callback => {...}
```



# Comparison with Promises and Callbacks

Our main motivation for dealing with CPS functions is to enhance
the power of common coding patterns into a single unified abstraction,
which can capture the advantages typically associated with Promises vs callbacks.

In the [introductory section on Promises](http://exploringjs.com/es6/ch_promises.html#sec_introduction-promises) of his wonderful book [Exploring ES6](http://exploringjs.com/es6/),
[Dr. Axel Rauschmayer](http://dr-axel.de/) collected a list of 
advantages of Promises over callbacks,
that we would like to consider here in the light of CPS functions
and explain how, in our view, the latters can enjoy the same advantages.

## Returning results
> No inversion of control: similarly to synchronous code, Promise-based functions return results, they don’t (directly) continue – and control – execution via callbacks. That is, the caller stays in control.

We regard the CPS functions returning their output in similar fashion as promises, 
via the arguments inside each callback call.
Recall that a result inside promise can only be extracted via a callback,
which is essentially the same as passing the callback to a CPS function:
```js
// pass callbacks to promise
const promise.then(cb1, cb2) 
// => result is delivered via cb1(result)
```
```js
// pass callbacks to CPS function
const cps(f1, f2)
// => a tuple (vector) of results is deliverd via f1(res1, res2, ...)
```
Thus, CPS functions can be regarded as generalization of promises,
where callbacks are allowed to be called multiple times with several arguments each time,
rather than with a single value.
Note that syntax for CPS function is even shorter - ther is no `.then` method needed.


## Chaining
> Chaining is simpler: If the callback of `then()` returns a Promise (e.g. the result of calling another Promise-based function) then `then()` returns that Promise (how this really works is more complicated and explained later). As a consequence, you can chain then() method calls: 
> ```js
asyncFunction1(a, b)
  .then(result1 => {
      console.log(result1);
      return asyncFunction2(x, y);
  })
  .then(result2 => {
      console.log(result2);
  });
```

In our view, the complexity of chaing for the callbacks is merely due to the lack of the methods for doing it.
On a basic level, a Promise wraps a CPS function into an object providing such methods.
However, the Promise constructor also adds restricitons on the functionality and generally does a lot more.
On the other hand, to have similar chaining methods, much less powerful methods are needed,
that can be uniformly provided for general CPS functions. 
The above example can then be generalized to arbitrary CPS functions:

```js
// wrapper providing the chaing methods
CPS.of(cpsFunction1(a, b))
	// 'flatMap' (also called 'chain') is used to chain with parametrized CPS functions
  .flatMap(result1 => {
      console.log(result1);
      return cpsFunction2(x, y);
  })
  // 'map' is used to chain with ordinary functions
  .map(result2 => {
      console.log(result2);
  });
```
Here `CPS.of` is a lightweight object wrapper providing the `map` and `flatMap` methods among others,
such that `CPS.of` and `map` conform to the [Pointed Functor](https://stackoverflow.com/questions/39179830/how-to-use-pointed-functor-properly/41816326#41816326) and `CPS.of` and `flatMap` 
to the [Monadic](https://github.com/rpominov/static-land/blob/master/docs/spec.md#monad) [interface](https://github.com/fantasyland/fantasy-land#monad).
At the same time, the full functional structure is preserved allowing for drop in replacement
`cpsFun` with `CPS.of(cpsFun)`, see below.

## Asynchronous composition
> Composing asynchronous calls (loops, mapping, etc.): is a little easier, because you have data (Promise objects) you can work with.

Similar to promises wrapping their data, 
we regard the CPS functions as wrapping the outputs of their callbacks.
Whenever methods are needed, a CPS function can be explicitly wrapped into 
its CPS object via the `CPS.of`, 
similar to how the `Promise` constructor wraps its producer function,
except that `CPS.of` does nothing else.
There is no recursive unwrapping of "thenables" nor other promises as with
the Promise constructor.

In addition, the CPS object `CPS.of(cpsFunction)` retains the same information
by delivering the same functionality via direct funtion calls with the same callbacks!
That is, the following calls are identical: 
```js
cpsFunction(cb1, cb2, ...)
CPS.of(cpsFunction)(cb1, cb2, ...)
```
That means, the wrapped CPS function can be dropped directly into the same code
preserving all the functionality with no change!

In regard of composing asynchronous calls, with CPS functions it can be as simple as in
the above example.


## Error handling
> Error handling: As we shall see later, error handling is simpler with Promises, because, once again, there isn’t an inversion of control. Furthermore, both exceptions and asynchronous errors are managed the same way.

In regards of error handling, 
the following paragraph in here http://exploringjs.com/es6/ch_promises.html#_chaining-and-errors
seems relevant:

> There can be one or more then() method calls that don’t have error handlers. Then the error is passed on until there is an error handler.
```js
asyncFunc1()
.then(asyncFunc2)
.then(asyncFunc3)
.catch(function (reason) {
    // Something went wrong above
});
```

And here is the same example with CPS functions:
```js
CPS.of(cpsFunc1)
.flatMap(cpsFunc2)
.flatMap(cpsFunc3)
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
both exceptions and asynchronous errors can be managed the same way, if necessary:

On the other hand, in comparison with Promises, 
the CPS functions allow for clean separation between exceptions such as bugs 
that need to be caught as early as possible, and the asynchronous errors 
that are expected and returned via the error callbacks calls.
The absence of similar feature for Promises attracted [considerable criticisms](https://medium.com/@avaq/broken-promises-2ae92780f33).


## Signatures
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
> Standardized: Prior to Promises, there were several incompatible ways of handling asynchronous results (Node.js callbacks, XMLHttpRequest, IndexedDB, etc.). With Promises, there is a clearly defined standard: ECMAScript 6. ES6 follows the standard Promises/A+ [1]. Since ES6, an increasing number of APIs is based on Promises.

The CPS functions build directly on the standard already established for JavaScript functions.
The provided methods such as `of` (aka `pure`, `return`), `map` (aka `fmap`), `flatMap` (aka `chain`, `bind`) strictly follow the general standards for algebraic data types established by Functional Programming languages and Category Theory.
