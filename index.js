const { mergeArray, inheritPrototype } = require('./utils')

/* ----- General purpose utils ----- */

/**
 * Pipeline Operator:
 * pass tuple of values to sequence of functions
 * similar to the UNIX pipe (x1, ..., xn) | f1 | f2 | ... | fm
 * 
 * @name pipeline
 * @param {...*} args - tuple of arbitrary values.
 * @param {...functions} fns - functions (f1, f2, ..., fn).
 * @returns {*} fn(...f2(f1(...args))...) 
 *    - functions applied one after another.
 *
 * @examples
 * pipeline(x)(f1, f2, f3)
 *    is equivalent to f3(f2(f1(x)))
 * pipeline(x,y)(f, g)
 *    is equivalent to g(f(x, y))
 */
const pipeline = (...args) => (...fns) => fns.slice(1).reduce(
  (acc, fn) => fn(acc),
  fns[0](...args)
)



/* ----- CPS operators ----- */

/**
 * Create CPS function with given tuple as immediate output.
 *
 * @name CPS.of
 * @param {...*} args - tuple of arbitrary values.
 * @returns {function} CPS.of(...args) - CPS function
 *    that outputs (...args) inside its first callback
 *    no other output is passed to any other callback.
 *
 * @example
 *    CPS.of(x1, x2, x3)
 *        is equivalent to the CPS function 
 *    cb => cb(x1, x2, x3)
 *
 * The pair (CPS.map, CPS.of) conforms to the Pointed Functor spec, 
 * see {@link https://stackoverflow.com/a/41816326/1614973}.
 */
const of = (...args) => cb => cb(...args)


const ofN = idx => (...args) => (...cbs) => cbs[idx](...args)



/**
 * Chain is the most basic CPS operator
 * that chains outputs of CPS function with
 * tuple of functions returning CPS functions,
 * where the nth function applies to each output of the nth callback
 * and the resulting outputs are gathered by index.
 * 
 * @signature (...cpsFns) -> CPS -> CPS (curried)
 *
 * @name CPS.chain
 * @param {...Function} fns 
 *    - tuple of functions, each returning CPS function.
 * @param {Function} cpsFn - CPS function.
 * @returns {Function} CPS.chain(...fns)(cpsFn)
 *    - CPS function whose nth callback's output is gathered from
 *    the nth callbacks' outputs of each function fns[j] for each j
 *    evaluated for each output of the jth callback of `cpsFn`.
 *    If 'fns' has fewever functions than the number of callbacks passed,
 *    the extra callbacks receive the same output as from cpsFn
 *
 * @example
 *    const cpsFn = (cb1, cb2) => cb1(2, 3) + cb2(7, 9)
 *      2 callbacks receive outputs (2, 3) and (7, 9)
 *    const cpsF1 = (x, y) => (cb1, cb2) => cb1(x + y) + cb2(x - y)
 *    const cpsF2 = (x, y) => cb => cb(x, -y)
 *    CPS.chain(cpsF1, cpsF2)(cpsFn)
 *      is equivalent to the CPS function
 *    (cb1, cb2) => cb1(5) + cb2(7, -9)
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
 * 
 * @signature (...fns) -> CPS -> CPS (curried)
 *
 * @name CPS.map
 * @param {...function} (...fns) - functions.
 * @param {function} cpsFun - CPS function.
 * @returns {function} CPS.map(...fns)(cpsFun) 
 *    - CPS function whose nth callback's output equals 
 *    the nth callback's output of `cpsFun` transformed via function fns[n]
 *
 * @example
 *    const cpsFun = (cb1, cb2) => cb1(2, 3) + cb2(7)
 *      2 callbacks receive corresponding outputs (2, 3) and (7)
 *    CPS.map(f1, f2)(cpsFun)
 *      is equivalent to the CPS function
 *    (cb1, cb2) => cb1(f1(2, 3)) + cb2(f2(7))
 *      where f1 and f2 transform respective outputs.
 *
 * @example
 *    const cpsFromPromise = promise => (onRes, onErr) => promise.then(onRes, onErr)
 *    CPS.map(f1, f2)(cpsFromPromise(promise))
 *      is equivalent to
 *    cpsFromPromise(promise.then(f1).catch(f2))
 *
 * The pair (CPS.map, CPS.of) conforms to the Pointed Functor spec, 
 * see {@link https://stackoverflow.com/a/41816326/1614973}.
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
 * Iterates tuple of reducers over tuple of states
 * and outputs from CPS function regarded as actions.
 * `reducers` and `states` are matched by index.
 *
 * @signature (...reducers) -> (...states) -> cpsAction -> cpsState
 *
 * @name CPS.scan
 * @param {...function} (...reducers)
 *    where @signature of each reducer is (state, ...actions) -> state
 * @param {...*} (...states) - tuple of states.
 * @param {function} cpsAction - CPS function.
 * @returns {Function} CPS.scan(...reducers)(...states)(cpsAction)
 *    - CPS function whose nth callback receives the outputs obtained by iterating 
 *    the stream of outputs from the nth callback of cpsAction 
 *    over reducers[n] starting from with states[n]
 */
const scan = (...reducers) => (...states) => cpsAction => {
  // chain receives tuple of functions, one per reducer
  // nth CPS function inside chain receives nth callback output of cpsAction
  let cpsTrasformer = (reducer, idx) => (...action) => (...cbs) => {
      // accessing states and reducers by index
      states[idx] = reducer(states[idx], ...action)
      cbs[idx](states[idx])  
    }
  // chaining outputs of cpsAction with multiple reducers, one per state
  return chain(...reducers.map(cpsTrasformer))(cpsAction)
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
  chain
})

const CPS = cpsFn => {
  // clone the function
  let cpsWrapped = (...args) => cpsFn(...args)
  Object.setPrototypeOf(cpsWrapped, protoObj)
  return cpsWrapped
}

module.exports = { 
  pipeline, of, map, chain, filter, scan, CPS 
}
