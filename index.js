const { isNil, mergeArray, inheritPrototype } = require('./utils')

/* ----- General purpose utils ----- */

exports.multiCurry2 = f => (...a) => (...b) => f(...a, ...b)

exports.multiCurryN = n => f => {
  while(--n > 0) {
    f = exports.multiCurry2(f)
  }
  return f
}


/**
 * Pass tuple of values to sequence of functions similar to UNIX pipe
 * `(x0,...,xn) | f0 | f1 | ... | fm`.
 *
 * @param {...*} args - tuple of arbitrary values.
 * @param {...Function} fns - functions `(f0,f1,...,fn)`.
 * @returns {*} `pipeline(...args)(...fns)`
 *    - Result of functions applied one after another, equivalent to
 *    `fn(...f1(f0(...args))...)`
 *
 * @example
 * pipeline(x,y)(f0,f1,f2)
 *   // is equivalent to
 * f2(f1(f0(x,y)))
 */
const pipeline = (...args) => (...fns) => fns.slice(1).reduce(
  (acc, fn) => fn(acc),
  fns[0](...args)
)

/**
 * Compose functions left to right as in ramda's `pipe`.
 * 
 * @param {...Function} fns - functions `(f0,f1,...,fn)`.
 * @returns {*} `pipe(...fns)`
 *    - Composite function `(...args) => fn(...f1(f0(...args))...)`.
 * 
 * @example
 * pipe((a,b)=>a+b, x=>x*2)
 *   // is equivalent to
 * (a,b)=>(a+b)*2
 * 
 */
const pipe = (...fns) => (...args) => pipeline(...args)(...fns)


/* ----- CPS operators ----- */

/**
 * Create CPS function with provided tuple as immediate output.
 *
 * @param {...*} (x0,...,xn) - tuple of arbitrary values.
 * @returns {Function} `of(x1,...,xn)` - CPS function
 *    that immediately calls it 1st callback `cb` with outputs `(x0,...,xn)`.
 *    No other callback is called. (For multi-callback version see `ofN`.)
 *
 * @example
 * of(x0,x1,x2)
 *   // is equivalent to the CPS function
 * cb => cb(x0,x1,x2)
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
 * ofN(1)(x0,x1)
 *   // is equivalent to the CPS function
 * (cb0,cb1) => cb1(x0,x1)
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
 * @signature (...fns) -> CPS -> CPS
 *
 * @param {...Function} (f0,...,fn)
 *    - tuple of functions, each returning CPS function.
 * @param {Function} cpsFn - CPS function.
 * @returns {Function} `chain(f0,...,fn)(cpsFn)`
 *    - CPS function whose nth callback's output is gathered from
 *    the nth callback's outputs of each function fns[j] for each j
 *    evaluated for each output of the jth callback of `cpsFn`.
 *    If 'fns' has fewever functions than the number of callbacks passed,
 *    the extra callbacks receive the same output as from cpsFn
 *
 * @example
 *   // callbacks `cb0,cb1` receive outputs respectively `(2,3)` and `(7,9)`
 * const cpsFn = (cb1,cb2) => {cb1(2,3); cb2(7,9)}
 * const f1 = (x,y) => (cb1,cb2) => {cb1(x+y); cb2(x-y)}
 * const f2 = (x,y) => cb => {cb(x,-y)}
 *
 * chain(f1,f2)(cpsFn)
 *   // cpsFn -> (2,3) -> f1 -> (2+3) -> c1  /->(7,-9) -> c1
 *   //      \              \-> (2-3) -> c2 /
 *   //      \-> (7,9) -> f2 -------------- 
 *   // is equivalent to the CPS function
 * (c1,c2) => {c1(2+3); c2(2-3); c1(7,-9)}
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
  fns = fns.map((f,ind) => isNil(f) ? ofN(ind) : f)
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
 * The pair `(map,of)` conforms to the Pointed Functor spec,
 * see {@link https://stackoverflow.com/a/41816326/1614973}.
 *
 * @signature (...fns) -> CPS -> CPS
 *
 * @param {...Function} (f0,...,fn) - tuple of functions.
 * @param {Function} cpsFn - CPS function.
 * @returns {function} `map(f0,...,fn)`
 *  - function taking CPS function `cpsFn`
 *    and returning new CPS function whose nth callback's output equals
 *    the jth callback's output of `cpsFun` transformed with function `fj`.
 *    If `fj` is undefined or null, the output is passed unchanged.
 *
 * @example
 *   // 2 callbacks receive respective outputs (2,3) and (7)
 * const cpsFn = (cb0,cb1) => {cb0(2,3); cb1(7)}
 * const f0 = (x,y) => x+y
 * const f1 = z => z*6
 * map(f0,f1)(cpsFn)
 *   // is equivalent to the CPS function
 * (cb0,cb1) => {cb0(2+3); cb1(f1(7*6))}
 *
 * @example
 * const cpsFromPromise = promise => (onRes,onErr) => promise.then(onRes,onErr)
 * map(f0,f1)(cpsFromPromise(promise))
 *   // is equivalent to
 * cpsFromPromise(promise.then(f0).catch(f1))
 */
// precompose every callback with fn from array matched by index
// if no function provided, default to the identity
const map = (...fns) => chain(...fns.map((f, idx) =>
  (...args) => ofN(idx)(f(...args))
))


/**
 * Same as `map` but spread return values of transforming functions.
 * This allows to transform output tuples into tuples rather than single values as `map` does.
 * As JavaScript has no tuples, use arrays instead.
 * 
 * @example
 *   // 1 callback receives output `(2,3)`
 * const cpsFn = cb => cb(2,3)
 *   // `f` transforms `(x,y)` to `(x+y,x-y)` (written as array)
 * const f = (x,y) => [x+y,x-y]
 * map(f)(cpsFn)
 *   // is equivalent to the CPS function
 * cb => cb(2+3,2-3)
 */
exports.mapSpread = (...fns) => chain(...fns.map((f, idx) =>
  (...args) => ofN(idx)(...f(...args))
))



/**
 * Filter outputs making predicates `(pred0,...,predn)` truthy.
 *  Pass through only outputs from jth callback making `predj` truthy.
 */
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
  if (args.length < 2) throw Error(`Scan needs at least 2 args, curently: ${JSON.stringify(args)}`)
  let reducers = args.slice(0,-1),
    acc = args.at(-1)
  // chain receives tuple of functions, one per reducer
  // nth CPS function inside chain receives nth callback output of cpsAction
  let cpsTrasformer = reducer => isNil(reducer) ? undefined : (...action) => cb => {
      // accessing vals and reducers by index
      acc = reducer(acc, ...action)
      cb(acc)
    }
  // chaining outputs of cpsAction with multiple reducers, one per state
  return chain(...reducers.map(cpsTrasformer))
}

// simplified scan dropping the seed
const scanS = (...args) => scan(...args, undefined)


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


/**
 * Lift binary function to act on values wraped inside CPS functions
 */
exports.lift2 = f => (F1, F2) => pipeline(F2)(
  ap(map(exports.multiCurryN(2)(f))(F1))
)



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

/**
 * Wraps CPS function into object providing all CPS operators as methods
 */
exports.CPS = cpsFn => {
  // clone the function
  let cpsWrapped = (...args) => cpsFn(...args)
  Object.setPrototypeOf(cpsWrapped, protoObj)
  return cpsWrapped
}



/* ------- CPS utils ------ */

/**
 * Convert NodeJS function to CPS factory
 * 
 * @param {Function} nodeF - function with Node style callback `cb` as last argument:
 *     cb(error, result)
 * @returns {Function} node2cps(nodeF) - CPS factory function taking all args but last
 *     that returns CPS function with 2 callbacks similar to Promise
 */
exports.node2cps = nodeF => (...args) => exports.CPS(
  (onRes, onErr) => nodeF(...args, (e, ...x) => e ? onErr(e) : onRes(...x))
)

/**
 * Convert Promise factory to CPS factory
 *     makes promise lazy by defering promise creation
 * 
 * @param {Function} promiseFactory - function that returns Promise
 * @returns {Function} promiseF2cps(promiseFactory) - CPS factory function
 */
exports.promiseF2cps = promiseFactory => (...args) => (onRes, onErr) => promiseFactory(...args).then(onRes, onErr)

/**
 * convert syncrounous outputs of CPS function to array of output arrays
 *  output (x1,...,xn) in jth callback adds [x1,...,xn] or x1 if n=1 to jth
 */
exports.cpsSync2arr = cpsF => {
  let arr = []
  cpsF((...args) => arr.push(args))
  return arr
}


module.exports = {
  ...exports,
  pipeline, pipe,
  of, ofN, map, chain, filter, scan, scanS, ap,
}
