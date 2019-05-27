# cpsfy

[![npm version](https://img.shields.io/npm/v/cpsfy.svg)]
(http://npm.im/cpsfy)
[![install size](https://packagephobia.now.sh/badge?p=cpsfy)]
(https://packagephobia.now.sh/result?p=cpsfy)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/cpsfy.svg)]
(https://bundlephobia.com/result?p=cpsfy)
[![dependencies](https://david-dm.org/dmitriz/cpsfy.svg)]
(https://david-dm.org/dmitriz/cpsfy) 
[![devDependencies](https://badgen.now.sh/david/dev/dmitriz/tiny-cps)]
(https://david-dm.org/dmitriz/tiny-cps?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/dmitriz/tiny-cps/badge.svg?targetFile=package.json)](https://snyk.io/test/github/dmitriz/tiny-cps?targetFile=package.json)
[![Greenkeeper badge](https://badges.greenkeeper.io/dmitriz/tiny-cps.svg)]
(https://greenkeeper.io/) 
[![MIT License](https://img.shields.io/npm/l/tiny-cps.svg?style=flat-square)]
(http://opensource.org/licenses/MIT) 
[![Build Status](https://travis-ci.org/dmitriz/cpsfy.svg?branch=master)]
(https://travis-ci.org/dmitriz/cpsfy)
[![Coverage Status](https://coveralls.io/repos/github/dmitriz/cpsfy/badge.svg?branch=v2.0.10)]
(https://coveralls.io/github/dmitriz/cpsfy?branch=v2.0.10)
[![codecov](https://codecov.io/gh/dmitriz/cpsfy/branch/master/graph/badge.svg)]
(https://codecov.io/gh/dmitriz/cpsfy)

[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/dmitriz/tiny-cps.svg?logo=lgtm&logoWidth=18)]
(https://lgtm.com/projects/g/dmitriz/tiny-cps/context:javascript)
[![CodeFactor](https://www.codefactor.io/repository/github/dmitriz/tiny-cps/badge)]
(https://www.codefactor.io/repository/github/dmitriz/tiny-cps)
[![codebeat badge](https://codebeat.co/badges/8cd1b450-262f-4aa1-be1a-d44596f2777e)]
(https://codebeat.co/projects/github-com-dmitriz-tiny-cps-master)

Tiny but powerful goodies for Continuation-Passing-Style (CPS) functions

```sh
npm install cpsfy
```
*No dependency policy.*
For maximum security, this package is intended not to have dependencies ever.

## CPS function
Any function
```js
const cpsFn = (cb1, cb2, ...) => { ... } 
```
that expects to be called with several (possibly zero) functions (callbacks) as arguments. The number of callbacks may vary each time `cpsFn` is called. Once called and running, `cpsFn` may call any of the callbacks `cbn` any (possibly zero) number of times with any number `m` of arguments `(x1, ..., xm)`, where `m` may also vary from call to call. The `m`-tuple (vector) `(x1, ..., xm)` is regarded as the *output* of `cpsFn` passed to the `n`the callback:
```js
// (x1, ..., xm) is output from nth callback whenever
cbn(x1, ..., xm)  // is called
```
In other words, a CPS function receives any number of callbacks that it may call in any order any number of times at any moments immediately or in the future with any number of arguments.


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
The wrapped CPS function `CPS(cpsFn)` has all operators available as methods, while it remains plain CPS function, i.e. can be called with the same callbacks:
```js
CPS(cpsFn)(f1, f2, ...) // is equivalent to
cpsFn(f1, f2, ...)
```

#### chaining
```js
// as methods
CPS(cpsFn).map(f).chain(g).filter(h)

// of as functional pipeline
pipeline(cpsFn)(
  map(f),
  chain(g),
  filter(h)
)
```

### `map(...functions)(cpsFunction)`
```js
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
```js
const fs = require('fs')
const readFile = (file, encoding) =>
  cb => fs.readFile(file, encoding, cb)   // CPS function

// read file and convert all letters to uppercase
const getCaps = map(str => str.toUpperCase())(
  readFile('message.txt', 'utf8')
)
// or
const getCaps = CPS(readFile('message.txt', 'utf8'))
  .map(str => str.toUpperCase())
// or
const getCaps = pipeline(readFile('message.txt', 'utf8'))(
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
chain(f1, f2, ...)(cpsFn)
CPS(cpsFn).chain(f1, f2, ...)
pipeline(cpsFn)(chain(f1, f2, ...))
```
where each `fn` is a curried function
```js
// fn(x1, x2, ...) is expected to return a CPS function
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
```js
const writeFile = (file, encoding, content) =>
  // CPS function
  cb => fs.readFile(file, encoding, content, cb)

const copy = chain(
  // function that returns CPS function
  text => writFile('target.txt', 'utf8', text)
)(
  readFile('source.txt', 'utf8')  // CPS function
)
// or
const copy = CPS(readFile('source.txt', 'utf8'))
  .chain(text => writFile('target.txt', 'utf8', text))
// or
const copy = pipeline(readFile('source.txt', 'utf8'))(
  chain(text => writFile('target.txt', 'utf8', text))
)

// copy is a CPS function, call it with any callback
copy((err, data) => err 
  ? console.error(err) 
  : console.log(data)
) // => file content is capitalized and printed
```

### `filter(...predicates)(cpsFunction)`
```js
filter(pred1, pred2, ...)(cpsFn)
CPS(cpsFn).filter(pred1, pred2, ...)
pipeline(cpsFn)(filter(pred1, pred2, ...))
```
where each `predn` is the `n`th predicate function used to filter output from the `n`th callback of `cpsFn`. 

#### Result of applying `chain`
New CPS function that calls its `n`th callback `cbn(x1, x2, ...)` whenever `(x1, x2, ...)` is an output from the `n`th callback of `cpsFun` and
```js
predn(x1, x2, ...) == true
```

#### Example of `filter`
```js
// only copy text if it is not empty
const copyNotEmpty = CPS(readFile('source.txt', 'utf8'))
  .filter(text => text.length > 0)
  .chain(text => writFile('target.txt', 'utf8', text))

// copyNotEmpty is CPS function, call with any callback
copyNotEmpty(err => console.error(err))
```

### `scan(...reducers)(...initialValues)(cpsFunction)`
Similar to [`reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce), except that all partial accumulated values are passed into callback whenever there is new output.
```js
scan(red1, red2, ...)(x1, x2, ...)(cpsFn)
(cpsFn).scan(red1, red2, ...)(x1, x2, ...)
pipeline(cpsFn)(scan(red1, red2, ...)(x1, x2, ...))
```
where each `redn` is a *reducer*
```
// compute new accumulator value from the old one 
// and the tuple of current values (y1, y2, ...)
const redn = (acc, y1, y2, ...) => ... 
```

#### Result of applying `scan`
New CPS function whose output from the `n`the callback is the `n`th accumulated value `accn`. Upon each output `(y1, y2, ...)`, the new acculated value `redn(accn, y1, y2, ...)` is computed and passed into the callback. The nth value `xn` serves in place of `acc` at the start, similar to `reduce`. Note that the initial values `(x1, x2, ...)` must be passed as curried arguments to avoid getting mixed with reducers.


#### Example of `scan`
```js
// CPS function with 2 callbacks, a click  on one
// of the buttons sends '1' into respective callback
const getVotes = (onUpvote, onDownvote) => {
  upvoteButton.addEventListener('click', 
    ev => onUpvote(1)
  )
  downvoteButton.addEventListener('click', 
    ev => onDownvote(1)
  )  
}
const add = (acc, x) => acc + x
// count numbers of up- and downvotes and 
// pass into respective callbacks
const countVotes = scan(add, add)(0, 0)(getVotes) // or
const countVotes = CPS(getVotes).scan(add, add)(0, 0)

// countVotes is CPS function that we can call 
// with any pair of callbacks
countVotes(
  upvotes => console.log(upvotes, ' votes for'),
  downvotes => console.log(downvotes, ' votes against'),
)
```


## More details?
This `README.md` is kept minimal to reduce the package size. For more human introduction, motivation, use cases and other details, please see [DOCUMENTATION](DOCUMENTATION.md).






