const { mergeArray, inheritPrototype } = require('./utils')

/* ----- General purpose utils ----- */

const curry2 = f => (...a) => (...b) => f(...a, ...b)

/**
 * Pass tuple of values to sequence of functions similar to UNIX pipe
 * `(x1, ..., xn) | f1 | f2 | ... | fm`
 *
 * @param {...*} args - tuple of arbitrary values.
 * @param {...Function} fns - functions `(f1, f2, ..., fn)`.
 * @returns {*} `pipeline(...args)(...fns)`
 *    - Result of functions applied one after another, equivalent to
 *    `fn(...f2(f1(...args))...)`
 *
 * @example
 * pipeline(x, y)(f1, f2, f3)
 *   // is equivalent to
 * f3(f2(f1(x, y)))
 */
const pipeline = (...args) => (...fns) => fns.slice(1).reduce(
  (acc, fn) => fn(acc),
  fns[0](...args)
)



/* ----- CPS operators ----- */

/**
 * Create CPS function with provided tuple as immediate output.
 *
 * @param {...*} args - tuple of arbitrary values.
 * @returns {Function} `of(...args)` - CPS function
 *    that immediately calls it first callback `cb` with outputs `(...args)`.
 *    No other callback is called.
 *
 * @example
 * of(x1, x2, x3)
 *   // is equivalent to the CPS function
 * cb => cb(x1, x2, x3)
 *
 */
const of = (...args) => cb => cb(...args)


/**
 * Multi-callback version of the `of` operator,
 * passing provided tuple into the nth callback.
 *
 * @param {Number} n - position number of the callback used.
 * @param {...*} args - tuple of arbitrary values.
 * @returns {Function} `ofN(n)(...args)` - CPS function
 *    that outputs `(...args)`` into its nth callback
 *    no other output is passed to any other callback.
 *
 * @example
 * ofN(1)(x1, x2)
 *   // is equivalent to the CPS function
 * (cb0, cb1) => cb1(x1, x2)
 */
const ofN = n => (...args) => (...cbs) => cbs[n](...args)



/**
 * Chain is the most basic CPS operator.
 * It chains outputs of CPS function with
 * tuple of functions returning CPS functions,
 * where the nth function applies to each output from the nth callback
 * and the resulting outputs are gathered by index.
 * If fewever functions are passed in the tuple,
 * outputs from remaining callbacks are preserved unchanged.
 *
 * @signature (...fns) -> CPS -> CPS (curried)
 *
 * @param {...Function} fns
 *    - tuple of functions, each returning CPS function.
 * @param {Function} cpsFn - CPS function.
 * @returns {Function} `chain(...fns)(cpsFn)`
 *    - CPS function whose nth callback's output is gathered from
 *    the nth callback's outputs of each function fns[j] for each j
 *    evaluated for each output of the jth callback of `cpsFn`.
 *    If 'fns' has fewever functions than the number of callbacks passed,
 *    the extra callbacks receive the same output as from cpsFn
 *
 * @example
 *   // 2 callbacks, 2 functions with 2 arguments
 * const cpsFn = (cb1, cb2) => {cb1(2, 3); cb2(7, 9)}
 *   // 2 callbacks receive outputs (2, 3) and (7, 9)
 * const f1 = (x, y) => (cb1, cb2) => {cb1(x + y); cb2(x - y)}
 * const f2 = (x, y) => cb => {cb(x, -y)}
 *
 * chain(f1, f2)(cpsFn)
 *   // is equivalent to the CPS function
 * (cb1, cb2) => {cb1(5); cb2(7, -9)}
 *
 * @example
 *   // convert to CPS function with 2 callbacks
 * const readFile = file => (onRes, onErr) =>
 *   fs.readFile(file, (e, name) => {
 *     e ? onErr(e) : onRes(name)
 *   })
 * const readName = readFile('index.txt') // CPS function
 *
 * const readFileByName = chain(name => readFile(name))(readName)
 *   // or equivalently
 * const readFileByName = chain(readFile)(readName)
 *
 */
const chain = (...fns) => cpsFn => {
  let cpsNew = (...cbs) => {
    // all callbacks from the chain get passed to each cpsFn
    let newCallbacks = fns.map(f =>
      (...args) => f(...args)(...cbs)
    )
    // add missing callbacks unchanged from the same positions
    return cpsFn(...mergeArray(newCallbacks, cbs))
  }
  inheritPrototype(cpsNew, cpsFn)
  return cpsNew
}



/**
 * Map CPS function over arbitrary tuple of functions, where for each n,
 * the nth function from the tuple transforms the output of the nth callback.
 * If fewever functions are passed in the tuple,
 * outputs from remaining callbacks are preserved unchanged.
 * The pair `(map, of)` conforms to the Pointed Functor spec,
 * see {@link https://stackoverflow.com/a/41816326/1614973}.
 *
 * @signature (...fns) -> CPS -> CPS (curried)
 *
 * @param {...Function} fns - tuple of functions.
 * @param {Function} cpsFn - CPS function.
 * @returns {function} `map(...fns)`
 *  - function taking CPS function `cpsFn`
 *    and returning new CPS function whose nth callback's output equals
 *    the nth callback's output of `cpsFun` transformed with function fns[n].
 *    If n > fns.length, the output is passed unchanged.
 *
 * @example
 * const cpsFn = (cb1, cb2) => {cb1(2, 3); cb2(7)}
 *   // 2 callbacks receive corresponding outputs (2, 3) and (7)
 * map(f1, f2)(cpsFn)
 *   // is equivalent to the CPS function
 * (cb1, cb2) => {cb1(f1(2, 3));  cb2(f2(7))}
 *   // where f1 and f2 transform respective outputs.
 *
 * @example
 * const cpsFromPromise = promise => (onRes, onErr) => promise.then(onRes, onErr)
 * map(f1, f2)(cpsFromPromise(promise))
 *   // is equivalent to
 * cpsFromPromise(promise.then(f1).catch(f2))
 */
// precompose every callback with fn from array matched by index
// if no function provided, default to the identity
const map = (...fns) => chain(...fns.map((f, idx) =>
  (...args) => ofN(idx)(f(...args))
))



// pass through only input truthy `pred`
const filter = (...preds) => {
  // call `chain` with the list of functions, one per each predicate
  let transformer = (pred, idx) => (...inputs) =>
    (...cbs) => (pred(...inputs)) && cbs[idx](...inputs)
  return chain(...preds.map(transformer))
}


/**
 * Iterates tuple of reducers over tuple of vals
 * and outputs from CPS function regarded as actions.
 * `reducers` and `vals` are matched by index.
 *
 * @signature (...reducers, init) -> cpsAction -> cpsState
 *
 * @param {...Function} reducers
 *    - functions of the form `red = (acc, ...vals) => newAcc`
 * @param {*} init - initial value for the iteration.
 * @param {Function} cpsFn - CPS function.
 * @returns {Function} `scan(...reducers, init)(cpsFn)`
 *    - CPS function whose output from the first callback
 *   is the accumulated value. For each output `(y1, y2, ...)`
 *   from the `n`th callback of `cpsFn, the `n`th reducer `redn`
 *   is used to compute the new acculated value
 *   `redn(acc, y1, y2, ...)`, where `acc` starts with `init`,
 *   similar to `reduce`.
 */
const scan = (...args) => {
  let reducers = args.slice(0,-1),
    [acc] = args.slice(-1)
  // chain receives tuple of functions, one per reducer
  // nth CPS function inside chain receives nth callback output of cpsAction
  let cpsTrasformer = reducer => (...action) => cb => {
      // accessing vals and reducers by index
      acc = reducer(acc, ...action)
      cb(acc)
    }
  // chaining outputs of cpsAction with multiple reducers, one per state
  return chain(...reducers.map(cpsTrasformer))
}



/**
 * Ap is the core operator to run CPS functions in parallel.
 * It applies functions to values,
 * where both functions and values are delivered separately as CPS outputs.
 *
 * @signature (...fns) -> CPS -> CPS (curried)
 *
 * @param {...Function} fns
 *    - tuple of CPS functions, each returning a function.
 * @param {Function} cpsFn - CPS function.
 * @returns {Function} `ap(...fns)(cpsFn)`
 *    - CPS function whose nth callback's output is
 *    the results of function call `f(...args)`, where
 *    function `f` is the latest nth callback's output from fns[j] for some j
 *    and `(...args)` is the latest output from the jth callback of `cpsFn`.
 *    Only the latest outputs are stored for each callback
 *    and no output is emitted unless both function and arguments are available.
 *
 * @example
 * const readFile = file => (onRes, onErr) =>
 *   fs.readFile(file, (e, name) => {
 *     e ? onErr(e) : onRes(name)
 *   })
 * const appendToFile = cb => addition => {
 *    readFile('old.txt')(content => cb(content + addition))
 * }
 *
 * const readFilesCombined = ap(appendToFile)(readFile('new.txt'))
 * readFilesCombined(res => console.log(res), err => console.err(err))
 *
 */
const ap = (...fns) => cpsFn => {
  let fCache = {},
    argsCache = {}
  let cpsNew = (...cbs) => {
    let newCallbacks = fns.map((f, idxF) => (...output) => {
      argsCache[idxF] = output
      if (fCache[idxF]) {
        Object.keys(fCache[idxF]).forEach(idxCb =>
        cbs[idxCb](fCache[idxF][idxCb](...output))
      )}
    })
    fns.forEach((f, idxF) => f(...cbs.map((cb, idxCb) => outputF => {
      if(!fCache[idxF]) fCache[idxF] = {}
      fCache[idxF][idxCb] = outputF
      // look over previously cached arguments from cpsFn
      let output = argsCache[idxF]
      if (output) cb(outputF(...output))
    })))
    // add missing callbacks from the same positions
    return cpsFn(...mergeArray(newCallbacks, cbs))
  }
  inheritPrototype(cpsNew, cpsFn)
  return cpsNew
}





/* ----- CPS methods ----- */

const apply2this = fn =>
  function(...args) {return fn(...args)(this)}

// apply function to all values of object
const objMap = fn => obj =>
  Object.keys(obj).reduce((acc, key) => {
    acc[key] = fn(obj[key])
    return acc
  }, {})

// Prototype methods
const protoObj = objMap(apply2this)({
  map,
  chain,
  filter,
  scan
})

const CPS = cpsFn => {
  // clone the function
  let cpsWrapped = (...args) => cpsFn(...args)
  Object.setPrototypeOf(cpsWrapped, protoObj)
  return cpsWrapped
}

module.exports = {
  curry2, pipeline,
  of, ofN, map, chain, filter, scan, ap, CPS
}
