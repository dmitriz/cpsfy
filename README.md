```
                                //  ) )     
    ___      ___      ___   __//__         
  //   ) ) //   ) ) ((   ) ) //   //   / / 
 //       //___/ /   \ \    //   ((___/ /  
((____   //       //   ) ) //        / /   

```
(Generated with http://patorjk.com/software/taag)

# cpsfy

[![npm version](https://img.shields.io/npm/v/cpsfy.svg)](http://npm.im/cpsfy)
[![install size](https://packagephobia.now.sh/badge?p=cpsfy)](https://packagephobia.now.sh/result?p=cpsfy)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/cpsfy.svg)](https://bundlephobia.com/result?p=cpsfy)
[![Build Status](https://travis-ci.org/dmitriz/cpsfy.svg?branch=master)](https://travis-ci.org/dmitriz/cpsfy)
[![CircleCI](https://circleci.com/gh/dmitriz/cpsfy.svg?style=svg)](https://circleci.com/gh/dmitriz/cpsfy)
[![dependencies](https://david-dm.org/dmitriz/cpsfy.svg)](https://david-dm.org/dmitriz/cpsfy) 
[![devDependencies](https://badgen.now.sh/david/dev/dmitriz/cpsfy)](https://david-dm.org/dmitriz/cpsfy?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/dmitriz/cpsfy/badge.svg?targetFile=package.json)](https://snyk.io/test/github/dmitriz/cpsfy?targetFile=package.json)
[![Greenkeeper badge](https://badges.greenkeeper.io/dmitriz/cpsfy.svg)](https://greenkeeper.io/) 
[![Coverage Status](https://coveralls.io/repos/github/dmitriz/cpsfy/badge.svg?branch=v2.0.10)](https://coveralls.io/github/dmitriz/cpsfy?branch=v2.0.10)
[![codecov](https://codecov.io/gh/dmitriz/cpsfy/branch/master/graph/badge.svg)](https://codecov.io/gh/dmitriz/cpsfy)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/dmitriz/cpsfy.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/dmitriz/cpsfy/context:javascript)
[![CodeFactor](https://www.codefactor.io/repository/github/dmitriz/cpsfy/badge)](https://www.codefactor.io/repository/github/dmitriz/cpsfy)
[![codebeat badge](https://codebeat.co/badges/2480c750-f9ea-46c0-a574-5e72dad17a4f)](https://codebeat.co/projects/github-com-dmitriz-cpsfy-master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/b530e9fcaac446a19d8172962b486b36)](https://app.codacy.com/app/dmitri14_3131/cpsfy?utm_source=github.com&utm_medium=referral&utm_content=dmitriz/cpsfy&utm_campaign=Badge_Grade_Dashboard)
[![Maintainability](https://api.codeclimate.com/v1/badges/a55f3fd9a13396325671/maintainability)](https://codeclimate.com/github/dmitriz/cpsfy/maintainability)
[![DeepScan grade](https://deepscan.io/api/teams/3918/projects/5693/branches/44286/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=3918&pid=5693&bid=44286)
[![MIT License](https://img.shields.io/npm/l/cpsfy.svg?style=flat-square)](http://opensource.org/licenses/MIT)


Tiny but powerful goodies for Continuation-Passing-Style (CPS) functions with functional composability backed by category theory foundations.

```sh
npm install cpsfy
```

(Or `pnpm install cpsfy` to [save disc space](https://github.com/pnpm/pnpm).)

*No dependency policy.*
For maximum security, this package is intended to be kept minimal and transparent with **no dependencies ever**.


## Quick demo
We want to read the content of the file `name.txt` into string `str` and remove spaces from both ends of `str`. If the resulting `str` is nonempty, 
we read the content of the file with that name into string `content`, otherwise do nothing.
Finally we split the `content` string into array of lines.
If there are any errors on the way, we want to handle them at the very end
in a separate function without any change to our main code.
```js
const fs = require('fs')
// function returning CPS function with 2 callbacks
const readFile = file => (onRes, onErr) =>  
  fs.readFile(file, (e, name) => { // read file as string
    e ? onErr(e) : onRes(name)
  })

// CPS wraps a CPS function to provide the methods
const getLines = CPS(readFile('name.txt'))
  // map applies function to the file content
  .map(file => file.trim()) 
  .filter(file => file.length > 0)// only pass if nonempty
  // chain applies function that returns CPS function
  .chain(file => readFile(file))  // read file content
  .map(text => text.split('\n'))  // split into lines
// => CPS function with 2 callbacks

// To use, simply pass callbacks in the same order
getLines(
  lines => console.log(lines),  // result callback
  err => console.error(err)  // error callback
)
// Note how we handle error at the end 
// without affecting the main logic!
```


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

// or equivalently with 'pipeline' operator
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
// or as method
const copy = CPS(readFile('source.txt', 'utf8'))
  .chain(text => writFile('target.txt', 'utf8', text))
// or with pipeline operator
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

#### Result of applying `filter`
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
```js
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




