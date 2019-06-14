```
                                //  ) )     
    ___      ___      ___   __//__         
  //   ) ) //   ) ) ((   ) ) //   //   / / 
 //       //___/ /   \ \    //   ((___/ /  
((____   //       //   ) ) //        / /   

```
(Generated with http://patorjk.com/software/taag)

# cpsfy

[![npm version](https://img.shields.io/npm/v/cpsfy.svg?logo=npm)](http://npm.im/cpsfy)
[![install size](https://packagephobia.now.sh/badge?p=cpsfy)](https://packagephobia.now.sh/result?p=cpsfy)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/cpsfy.svg)](https://bundlephobia.com/result?p=cpsfy)
[![Build Status](https://travis-ci.org/dmitriz/cpsfy.svg?branch=master)](https://travis-ci.org/dmitriz/cpsfy)
[![CircleCI](https://circleci.com/gh/dmitriz/cpsfy.svg?style=svg)](https://circleci.com/gh/dmitriz/cpsfy)
[![dependencies](https://david-dm.org/dmitriz/cpsfy.svg)](https://david-dm.org/dmitriz/cpsfy) 
[![devDependencies](https://badgen.now.sh/david/dev/dmitriz/cpsfy)](https://david-dm.org/dmitriz/cpsfy?type=dev)
[![Depfu](https://badges.depfu.com/badges/7f4dd00fbcaa502c2c104ad415223506/status.svg)](https://depfu.com/github/dmitriz/cpsfy)
[![Known Vulnerabilities](https://snyk.io/test/github/dmitriz/cpsfy/badge.svg)](https://snyk.io/test/github/dmitriz/cpsfy)
[![Renovate badge](https://badges.renovateapi.com/github/dmitriz/cpsfy)](https://renovatebot.com/dashboard#dmitriz/cpsfy)
[![Greenkeeper badge](https://badges.greenkeeper.io/dmitriz/cpsfy.svg)](https://greenkeeper.io/)
[![Coverage Status](https://coveralls.io/repos/github/dmitriz/cpsfy/badge.svg)](https://coveralls.io/github/dmitriz/cpsfy)
[![codecov](https://codecov.io/gh/dmitriz/cpsfy/branch/master/graph/badge.svg)](https://codecov.io/gh/dmitriz/cpsfy)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/dmitriz/cpsfy.svg?logo=lgtm)](https://lgtm.com/projects/g/dmitriz/cpsfy/context:javascript)
[![CodeFactor](https://www.codefactor.io/repository/github/dmitriz/cpsfy/badge)](https://www.codefactor.io/repository/github/dmitriz/cpsfy)
[![codebeat badge](https://codebeat.co/badges/2480c750-f9ea-46c0-a574-5e72dad17a4f)](https://codebeat.co/projects/github-com-dmitriz-cpsfy-master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/b530e9fcaac446a19d8172962b486b36)](https://app.codacy.com/app/dmitri14_3131/cpsfy?utm_source=github.com&utm_medium=referral&utm_content=dmitriz/cpsfy&utm_campaign=Badge_Grade_Dashboard)
[![Maintainability](https://api.codeclimate.com/v1/badges/a55f3fd9a13396325671/maintainability)](https://codeclimate.com/github/dmitriz/cpsfy/maintainability)
[![DeepScan grade](https://deepscan.io/api/teams/3918/projects/5693/branches/44286/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=3918&pid=5693&bid=44286)
[![GitHub last commit](https://img.shields.io/github/last-commit/dmitriz/cpsfy.svg?logo=github)](https://github.com/dmitriz/cpsfy/commits/master)
[![npm downloads](https://img.shields.io/npm/dt/cpsfy.svg?logo=npm)](https://www.npmjs.com/package/cpsfy)
[![MIT License](https://img.shields.io/npm/l/cpsfy.svg?color=blue)](http://opensource.org/licenses/MIT)


Tiny but powerful goodies for Continuation-Passing-Style (CPS) functions with functional composability backed by category theory foundations.

```sh
npm install cpsfy
```

(Or `pnpm install cpsfy` to [save disc space](https://github.com/pnpm/pnpm).)

*No dependency policy.*
For maximum security, this package is intended to be kept minimal and transparent with **no dependencies ever**.


## Quick demo
We want to read the content of `name.txt` into string `str` and remove spaces from both ends of `str`. If the resulting `str` is nonempty, 
we read the content of the file with that name into string `content`, otherwise do nothing.
Finally we split the `content` string into array of lines.
If there are any errors on the way, we want to handle them at the very end
in a separate function without any change to our main code.
```js
//function returning CPS function with 2 callbacks
const readFileCps = file => (onRes, onErr) =>  
  require('fs').readFile(file, (err, content) => {
    err ? onErr(err) : onRes(content)
  })

// CPS wraps a CPS function to provide the API methods
const getLines = CPS(readFileCps('name.txt'))
  // map applies function to the file content
  .map(file => file.trim()) 
  .filter(file => file.length > 0)
  // chain applies function that returns CPS function
  .chain(file => readFileCps(file))
  .map(text => text.split('\n'))
// => CPS function with 2 callbacks

// To use, simply pass callbacks in the same order
getLines(
  lines => console.log(lines),  // onRes callback
  err => console.error(err)  // onErr callback
)
```
Note how we handle error at the end without affecting the main logic!


### But can't I do it with promises?
Ok, let us have another example where you can't, shall we? At least not as easy. And maybe ... not really another. ;-)

Reading from static files is easy but boring.
Data is rarely static. 
What if we have to react to data changing in real time?
Like our file names arriving as data stream? 
Let us use [the popular websocket library](https://github.com/websockets/ws):
```js
const WebSocket = require('ws')
// general purpose CPS function listening to websocket
const wsMessageListenerCps = url => cb => new WebSocket(url).on('message', cb)
```
And here is the crux: 
>`wsMessageListenerCps(url)` is just another CPS function!

So we can simply drop it instead of `readFileCps('name.txt')` into exactly the same code and be done with it:
```js
const getLinesFromWS = CPS(wsMessageListenerCps(someUrl))
  .map(file => file.trim()) 
  .filter(file => file.length > 0)
  .chain(file => readFileCps(file))
  .map(text => text.split('\n'))

```
And if you paid attention, the new CPS function has only one callback,
while the old one had two! Yet we have used exactly the same code!
How so? Because we haven't done anything to other callbacks.
The only difference is in how the final function is called - with one callback instead of two. As `wsMessageListenerCps(url)` accepts one callback, so does 
`getLinesFromWS` when we call it:
```js
getLinesFromWS(lines => console.log(lines))
```
That will print all lines for all files whose names we receive from our websocket.
And if we feel overwhelmed and only want to see lines 
containing say "breakfast", nothing can be easier:
```
// just add a filter
const breakfastLines = CPS(getLinesFromWS)
  .filter(line => /[Bb]reakfast/.test(line))
// call it exactly the same way
breakfastLines(lines => console.log(lines))
```
and from now on we'll never miss a breakfast. :-)


## CPS function
Any function
```js
const cpsFn = (cb1, cb2, ...) => { ... } 
```
that expects to be called with several (possibly zero) functions (callbacks) as arguments. The number of callbacks may vary each time `cpsFn` is called. Once called and running, `cpsFn` may call any of its callbacks any (possibly zero) number of times with any number `m` of arguments `(x1, ..., xm)`, where `m` may also vary from call to call. The `m`-tuple (vector) `(x1, ..., xm)` is regarded as the *output* of `cpsFn` from the `n`the callback `cbn`:
```js
// (x1, ..., xm) becomes output from nth callback whenever
cbn(x1, ..., xm)  // is called, where n = 1, 2, ..., m
```
In other words, a CPS function receives any number of callbacks that it may call in any order any number of times at any moments immediately or in the future with any number of arguments.

### Example of CPS function - WebSocket

```js
const ws = require('ws')
const ws_cps = url => cb => new ws(url).on('message', cb))
```


## API in brief
```js
const { map, chain, filter, scan, CPS, pipeline } 
  = require('cpsfy')
```
Each of the `map`, `chain`, `filter`, `scan` operators can be used in 3 ways:
```js
// 'map' as curried function
map(f)(cpsFn)
// 'map' method provided by the 'CPS' wrapper
CPS(cpsFn).map(f)
// 'cpsFn' is piped into 'map(f)' via 'pipeline' operator
pipeline(cpsFn)(map(f))
```
The wrapped CPS function `CPS(cpsFn)` has all operators available as methods, while it remains a plain CPS function, i.e. can be called with the same callbacks:
```js
CPS(cpsFn)(f1, f2, ...) // is equivalent to
cpsFn(f1, f2, ...)
```

#### chaining
```js
// as methods
CPS(cpsFn).map(f).chain(g).filter(h)

// or equivalently with 'pipeline' operator
pipeline(cpsFn)(
  map(f),
  chain(g),
  filter(h)
)
```

### `map(...functions)(cpsFunction)`
```js
// these are equivalent
map(f1, f2, ...)(cpsFn)
CPS(cpsFn).map(f1, f2, ...)
pipeline(cpsFn)(map(f1, f2, ...))
```
For each `n`, apply `fn` to each output from the `n`th callback of `cpsFn`.

#### Result of applying `map`
New CPS function that calls its `n`th callback `cbn` as
```js
cbn(fn(x1, x2, ...))
```
whenever `cpsFn` calls its `n`th callback.

#### Example of `map`
Using `readFileCps` as above.
```js
// read file and convert all letters to uppercase
const getCaps = map(str => str.toUpperCase())(
  readFileCps('message.txt')
)
// or
const getCaps = CPS(readFileCps('message.txt'))
  .map(str => str.toUpperCase())
// or
const getCaps = pipeline(readFileCps('message.txt'))(
  map(str => str.toUpperCase())
)

// getCaps is CPS function, call with any callback
getCaps((err, data) => err 
  ? console.error(err) 
  : console.log(data)
) // => file content is capitalized and printed
```

### `chain(...functions)(cpsFunction)`
```js
// these are equivalent
chain(f1, f2, ...)(cpsFn)
CPS(cpsFn).chain(f1, f2, ...)
pipeline(cpsFn)(chain(f1, f2, ...))
```
where each `fn` is a curried function
```js
// fn is expected to return a CPS function
const fn = (x1, x2, ...) => (cb1, cb2, ...) => { ... }
```
The `chain` operator applies each `fn` to each output from the `n`th callback of `cpsFn`, however, the CPS *ouptup* of `fn` is passed ahead instead of the return value. 

#### Result of applying `chain`
New CPS function `newCpsFn` that calls `fn(x1, x2, ...)` whenever `cpsFn` passes output `(x1, x2, ...)` into its `n`th callback, and collects all outputs from all callbacks of all `fn`s. Then for each fixed `m`, outputs from the `m`th callbacks of all `fn`s are collected and passed into the `m`th callback `cbm` of `newCpsFn`:
```js
cbm(y1, y2, ...)  // is called whenever 
cbmFn(y1, y2, ...)  // is called where
// cbmFn is the mth callback of fn
```

#### Example of `chain`
Using `readFileCps` as above.
```js
// write version of readFileCps
const writeFileCps = (file, content) => (onRes, onErr) =>  
  require('fs').writeFile(file, content, (err, message) => {
    err ? onErr(err) : onRes(message)
  })

const copy = chain(
  // function that returns CPS function
  text => writeFileCps('target.txt', text)
)(
  readFileCps('source.txt')  // CPS function
)
// or as method
const copy = CPS(readFileCps('source.txt'))
  .chain(text => writeFileCps('target.txt', text))
// or with pipeline operator
const copy = pipeline(readFileCps('source.txt'))(
  chain(text => writeFileCps('target.txt', text))
)

// copy is a CPS function, call it with any callback
copy((err, data) => err 
  ? console.error(err) 
  : console.log(data)
) // => file content is capitalized and printed
```


### `filter(...predicates)(cpsFunction)`
```js
// these are equivalent
filter(pred1, pred2, ...)(cpsFn)
CPS(cpsFn).filter(pred1, pred2, ...)
pipeline(cpsFn)(filter(pred1, pred2, ...))
```
where each `predn` is the `n`th predicate function used to filter output from the `n`th callback of `cpsFn`. 

#### Result of applying `filter`
New CPS function that calls its `n`th callback `cbn(x1, x2, ...)` whenever `(x1, x2, ...)` is an output from the `n`th callback of `cpsFun` and
```js
predn(x1, x2, ...) == true
```

#### Example of `filter`
Using `readFileCps` and `writeFileCps` as above.
```js
// only copy text if it is not empty
const copyNotEmpty = CPS(readFileCps('source.txt'))
  .filter(text => text.length > 0)
  .chain(text => writeFileCps('target.txt', text))

// copyNotEmpty is CPS function, call with any callback
copyNotEmpty(err => console.error(err))
```

### `scan(...reducers, init)(cpsFunction)`
Similar to [`reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce), except that all partial accumulated values are passed into callback whenever there is new output.
```js
// these are equivalent
scan(red1, red2, ..., init)(cpsFn)
(cpsFn).scan(red1, red2, ..., init)
pipeline(cpsFn)(scan(red1, red2, ..., init))
```
where each `redn` is a *reducer* and `init` is the initial accumulated value.
```js
// compute new accumulator value from the old one 
// and the tuple of current values (y1, y2, ...)
const redn = (acc, y1, y2, ...) => ... 
```

#### Result of applying `scan`
New CPS function whose output from the first callback is the accumulated value. For each output `(y1, y2, ...)` from the `n`th callback, 
the `n`th reducer `redn` is used to compute the new acculated value 
`redn(acc, y1, y2, ...)`, where `acc` starts with `init`, similar to `reduce`.


#### Example of `scan`
```js
// CPS function with 2 callbacks, clicking on one
// of the buttons sends '1' into respective callback
const getVotes = (onUpvote, onDownvote) => {
  upvoteButton.addEventListener('click', 
    ev => onUpvote(1)
  )
  downvoteButton.addEventListener('click', 
    ev => onDownvote(1)
  )  
}
// count numbers of up- and downvotes and 
// pass into respective callbacks
const countVotes = CPS(getVotes)
  .scan(
    ([up, down], upvote) => [up + upvote, down], 
    ([up, down], downvote) => [up, down + downvote],
    [0,0]
   )

// countVotes is CPS function that we can call 
// with any callback
countVotes(
  votes => console.log('Total votes: ', votes),
)
```


### `ap(...cpsFunctions)(cpsFunction)` (TODO)
See [running CPS functions in parallel](DOCUMENTATION.md#running-cps-functions-in-parallel).
Inspired by the Applicative Functor interface, see e.g. https://funkia.github.io/jabz/#ap

### `lift(...functions)(cpsFunction)` (TODO)
See [lifting functions of multiple arguments](DOCUMENTATION.md#lifting-functions-of-multiple-parameters)
The "sister" of `ap`, apply functions with multiple arguments to
outputs of CPS functions running in parallel, derived from `ap`,
see e.g. https://funkia.github.io/jabz/#lift

### `merge(...cpsFunctions)` (TODO)
See [`CPS.merge`](DOCUMENTATION.md#cpsmerge-todo).
Merge outputs from multiple CPS functions, separately in each callback.
E.g. separately merge results and errors from multiple promises
running in parallel.

## More details?
This `README.md` is kept minimal to reduce the package size. For more human introduction, motivation, use cases and other details, please see [DOCUMENTATION](DOCUMENTATION.md).


## License
MIT © [Dmitri Zaitsev](https://github.com/dmitriz)




