# tiny-cps

[![npm version](https://img.shields.io/npm/v/tiny-cps.svg)](http://npm.im/tiny-cps)
[![install size](https://packagephobia.now.sh/badge?p=tiny-cps)](https://packagephobia.now.sh/result?p=tiny-cps)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/tiny-cps.svg)](https://bundlephobia.com/result?p=tiny-cps)
[![Build Status](https://travis-ci.org/dmitriz/tiny-cps.svg?branch=master)](https://travis-ci.org/dmitriz/tiny-cps)
[![coveralls](https://coveralls.io/repos/github/dmitriz/tiny-cps/badge.svg?branch=master)](https://coveralls.io/github/dmitriz/tiny-cps?branch=master)
[![codecov](https://codecov.io/gh/dmitriz/tiny-cps/branch/master/graph/badge.svg)](https://codecov.io/gh/dmitriz/tiny-cps)
[![CodeFactor](https://www.codefactor.io/repository/github/dmitriz/tiny-cps/badge)](https://www.codefactor.io/repository/github/dmitriz/tiny-cps)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/dmitriz/tiny-cps.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/dmitriz/tiny-cps/context:javascript)
[![dependencies](https://david-dm.org/dmitriz/tiny-cps.svg)](https://david-dm.org/dmitriz/tiny-cps) 
[![devDependencies](https://badgen.now.sh/david/dev/dmitriz/tiny-cps)](https://david-dm.org/dmitriz/tiny-cps?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/dmitriz/tiny-cps/badge.svg?targetFile=package.json)](https://snyk.io/test/github/dmitriz/tiny-cps?targetFile=package.json)
[![MIT License](https://img.shields.io/npm/l/tiny-cps.svg?style=flat-square)](http://opensource.org/licenses/MIT) 
[![Greenkeeper badge](https://badges.greenkeeper.io/dmitriz/tiny-cps.svg)](https://greenkeeper.io/) 

Tiny but powerful goodies for Continuation-Passing-Style (CPS) functions

```sh
npm install tiny-cps
```
*No dependency policy.*
For maximum security, this package is intended not to have any dependencies ever.

## CPS function
Any function
```js
//cb1, cb2, ... are called any number of times with any varying number of arguments
const cpsFn = (cb1, cb2, ...) => { ... } 
```
that expects to be called with several (possibly zero) functions (callbacks) as arguments. The number of callbacks may vary each time `cpsFn` is called. Once running, `cpsFn` may call any of the callbacks `cbn` any (including zero) number of times with any number `m` of arguments `(x1, ..., xm)`, where `m` may also vary from call to call. The `m`-tuple (vector) `(x1, ..., xm)` is regarded as the *output* of `cpsFn` passed to the `n`the callback:
```js
// (x1, ..., xm) is an output from the `n`th callback
cbn(x1, ..., xm)
```
In other words, a CPS function recieves any number of callbacks that it may call in any order any number of times with any arguments.


## API - brief description
```js
const { map, chain, CPS, pipeline } = require('tiny-cps')
```
Each CPS operator can be used in 3 ways:
```js
// 'map' as curried function
map(f)(cpsFn)
// 'map' method provided by the 'CPS' wrapper
CPS(cpsFn).map(f)
// 'cpsFn' is passed as value ("piped") into 'map(f)' via 'pipeline' operator
pipeline(cpsFn)(map(f))
```

### map
```js
map(f1, f2, ...)(cpsFn)
CPS(cpsFn).map(f1, f2, ...)
pipeline(cpsFn)(map(f1, f2, ...))
```
For each `n`, apply `fn` to each output from the `n`th callback of `cpsFn`.
The result is the new CPS function that calls its `n`th callback `cbn` as
```js
cbn(fn(x1, x2, ...))
```
whenever `cpsFn` calls its `n`th callback.

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

// getCaps is a CPS function, so we just call it with any callback
getCaps(
  (err, data) => err ? console.error(err) : console.log(data)
) // => file content is capitalized and printed to console
```

### chain
```js
chain(f1, f2, ...)(cpsFn)
CPS(cpsFn).chain(f1, f2, ...)
pipeline(cpsFn)(chain(f1, f2, ...))
```
where each `fn` is a curried function
```js
// fn(x1, x2, ...) is another CPS function
const fn = (x1, x2, ...) => (cb1, cb2, ...) => { ... }
```
The `chain` operator applies each `fn` to each output from the `n`th callback of `cpsFn`, however, the CPS *ouptup* of `fn` is passed ahead instead of the return value. The `chain` operator returns the new CPS function `newCpsFn` that calls `fn(x1, x2, ...)` whenever `cpsFn` passes output `(x1, x2, ...)` into its `n`th callback, and collects all outputs from all callbacks of all `fn`s. Then for each fixed `m`, outputs from the `m`th callbacks of all `fn`s are collected and passed into the `m`th callback `cbm` of `newCpsFn`:
```js
cbm(y1, y2, ...)  // is called whenever 
cbmFn(y1, y2, ...)  // is called where
// cbmFn is the mth callback of fn
```

```js
const writeFile = (file, encoding, content) =>
  cb => fs.readFile(file, encoding, content, cb)   // CPS function

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

// copy is a CPS function, so we just call it with any callback
copy(
  (err, data) => err ? console.error(err) : console.log(data)
) // => file content is capitalized and printed to console
```

### filter
```js
filter(pred1, pred2, ...)(cpsFn)
CPS(cpsFn).filter(pred1, pred2, ...)
pipeline(cpsFn)(filter(pred1, pred2, ...))
```
where each `predn` is the `n`th predicate function used to filter output from the `n`th callback of `cpsFn`. The result is the new CPS function that calls its `n`th callback `cbn(x1, x2, ...)` whenever `(x1, x2, ...)` is an output from the `n`th callback of `cpsFun` and
```js
predn(x1, x2, ...) == true
```

```js
// only copy if text is not empty
const copyNotEmpty = CPS(readFile('source.txt', 'utf8'))
  .filter(text => text.length > 0)
  .chain(text => writFile('target.txt', 'utf8', text))
```

### scan
Similar to [`reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce), except that all partial accumulated values are passed into callback whenever there is new output.
```js
scan(red1, red2, ...)(x1, x2, ...)(cpsFn)
(cpsFn).scan(red1, red2, ...)(x1, x2, ...)
pipeline(cpsFn)(scan(red1, red2, ...)(x1, x2, ...))
```
where each `redn` is a *reducer*
```
// take accumulated value 'acc' and input (y1, y2, ...) and return new acc. value
const redn = (acc, y1, y2, ...) => ... 
```
The result is the new CPS function whose output from the `n`the callback is the `n`th accumulated value `accn`. Upon each output `(y1, y2, ...)`, the new acculated value `redn(accn, y1, y2, ...)` is computed and passed into the callback. The nth value `xn` serves in place of `acc` at the start, similar to `reduce`. Note that the initial values `(x1, x2, ...)` must be passed as curried arguments to avoid getting mixed with reducers.

```js
// CPS function with 2 callbacks
// each click on one of the buttons sends '1' into respective callback
const getVotes = (onUpvote, onDownvote) => {
  upvoteButton.addEventListener('click', ev => onUpvote(1))
  downvoteButton.addEventListener('click', ev => onDownvote(1))  
}
const add = (acc, x) => acc + x
// count numbers of up- and downvotes and pass into respective callbacks
const countVotes = scan(add, add)(0, 0)(getVotes) // or
const countVotes = CPS(getVotes).scan(add, add)(0, 0)

// countVotes is CPS function that we can call with any pair of callbacks
countVotes(
  upvotes => console.log(upvotes, ' people voted for'),
  downvotes => console.log(downvotes, ' people voted against"),
)
```


## More details?
This `README.md` is kept minimal to reduce the package size. For more human introduction, motivation, use cases and other details, please see [DOCUMENTATION](DOCUMENTATION.md).






