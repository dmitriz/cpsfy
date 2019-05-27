/* ----- General purpose operators ----- */

/**
 * Pipeline Operator
 * passes tuple of values to sequence of functions
 * similar to the UNIX pipe (x1, ..., xn) | f1 | f2 | ... | fm
 * 
 * @name pipeline
 * @params {Tuple} (...args) tuple of arbitrary values
 * @curriedParams {Tuple of Functions} (...fns) tuple of functions that
 * @returns {value} fn(...f2(f1(...args))...) 
 *		where fns = [f1, f2, ..., fn]
 *
 * # Examples
 *
 * pipeline(x)(f1, f2, f3)
 *		is equivalent to f3(f2(f1(x)))
 * pipeline(x,y)(f, g)
 *		is equivalent to g(f(x, y))
 */
const pipeline = (...args) => (...fns) => fns.slice(1).reduce(
	(acc, fn) => fn(acc),
	fns[0](...args)
)



// Helper to inherit the prototype
const inheritState = (target, source) =>
 	pipeline(source)(
		Object.getPrototypeOf,
		prototype => Object.setPrototypeOf(target, prototype)
)



/* ----- CPS operators ----- */

/**
 * Create CPS function with given tuple as immediate output
 *
 * @name CPS.of
 * @params {Tuple} (...args) tuple of arbitrary values
 * @returns {CPS Function} CPS.of(...args) 
 *		that outputs (...args) inside its first callback
 *		no other output is passed to any other callback
 *
 * # Example
 *
 * 		CPS.of(x1, x2, x3)
 * 				is equivalent to the CPS function 
 * 		cb => cb(x1, x2, x3)
 *
 * The pair (CPS.map, CPS.of) conforms to the Pointed Functor spec, 
 * see {@link https://stackoverflow.com/a/41816326/1614973}
 */
const of = (...args) => cb => cb(...args)


/**
 * Map CPS function over arbitrary tuple of functions, where for each n, 
 * the nth function from the tuple transforms the output of the nth callback
 * 
 * @signature (...fns) -> CPS -> CPS (curried)
 *
 * @name CPS.map
 * @params {Tuple of Functions} (...fns)
 * @curriedParam {CPS Function} cpsFun
 * @returns {CPS Function} CPS.map(...fns)(cpsFun) 
 *		whose nth callback's output equals 
 *  	the nth callback's output of `cpsFun` transformed via function fns[n]
 *
 * # Examples
 *
 * 		const cpsFun = (cb1, cb2) => cb1(2, 3) + cb2(7)
 * 			2 callbacks receive corresponding outputs (2, 3) and (7)
 * 		CPS.map(f1, f2)(cpsFun)
 * 			is equivalent to the CPS function
 * 		(cb1, cb2) => cb1(f1(2, 3)) + cb2(f2(7))
 * 			where f1 and f2 transform respective outputs
 *
 *		const cpsFromPromise = promise => (onRes, onErr) => promise.then(onRes, onErr)
 *		CPS.map(f1, f2)(cpsFromPromise(promise))
 *			is equivalent to
 *		cpsFromPromise(promise.then(f1).catch(f2))
 *
 * The pair (CPS.map, CPS.of) conforms to the Pointed Functor spec, 
 * see {@link https://stackoverflow.com/a/41816326/1614973}
 */
const map = (...fns) => cpsFun => {
	let cpsNew = (...cbs) => cpsFun(
		// precompose every callback with fn matched by index or pass directly the args
		// collect functions in array and pass as callbacks to cpsFun
		...cbs.map(
			(cb, idx) => (...args) => fns[idx] ? cb(fns[idx](...args)) : cb(...args)
		)
	)
	inheritState(cpsNew, cpsFun)
	return cpsNew
}


/**
 * Chains outputs of CPS function with arbitrary tuple of other CPS functions,
 * where the nth function applies to each output of the nth callback
 * and the resulting outputs are gathered by index 
 * 
 * @signature (...cpsFns) -> CPS -> CPS (curried)
 *
 * @name CPS.chain
 * @params {Tuple of CPS Functions} (...cpsFns)
 * @curriedParam {CPS Function} cpsFun
 * @returns {CPS Function} CPS.chain(...fns)(cpsFun)
 * 		whose nth callback's output is gathered from
 *  	the nth callbacks' outputs of each function fns[j] for each j
 *  	evaluated for each output of the jth callback of `cpsFun`
 *
 * # Example
 *
 * 		const cpsFun = (cb1, cb2) => cb1(2, 3) + cb2(7, 9)
 *			2 callbacks receive outputs (2, 3) and (7, 9)
 * 		const cpsF1 = (x, y) => (cb1, cb2) => cb1(x + y) + cb2(x - y)
 * 		const cpsF2 = (x, y) => cb => cb(x, -y)
 * 		CPS.chain(cpsF1, cpsF2)(cpsFun)
 *			is equivalent to the CPS function
 * 		(cb1, cb2) => cb1(5) + cb2(7, -9)
 */
const chain = (...cpsFns) => cpsFun => {
	let cpsNew = (...cbs) => cpsFun(
		// precompose every callback with fn matched by index or pass directly the args,
		// collect functions in array and pass as callbacks to cpsFun
		...cpsFns.map(cpsFn =>
			// all callbacks from the chain get passed to each cpsFn
			(...args) => cpsFn(...args)(...cbs)
		)
	)
	inheritState(cpsNew, cpsFun)
	return cpsNew	
}


// pass through only input truthy `pred`
const filter = (...preds) =>
	// call `chain` with the list of arguments, one per each predicate
	chain(...preds.map((pred, idx) => 
		(...input) => (...cbs) => (pred(...input)) && cbs[idx](...input)
	))


/**
 * Iterates tuple of reducers over tuple of states
 * and outputs from CPS function regarded as actions.
 * `reducers` and `states` are matched by index.
 *
 * @signature (...reducers) -> (...states) -> cpsAction -> cpsState
 *
 * @name CPS.scan
 * @params {Tuple of functions} (...reducers)
 *  	where @signature of each reducer is (state, ...actions) -> state
 * @params {Tuple of values} (...states)
 * @param {CPS function} cpsAction
 * @returns {CPS function} CPS.scan(...reducers)(...states)(cpsAction)
 * 		whose nth callback receives the outputs obtained by iterating 
 *		the stream of outputs from the nth callback of cpsAction 
 *		over reducers[n] starting from with states[n]
 *
 */
const scan = (...reducers) => (...states) => cpsAction => 
  // chaining outputs of cpsAction with multiple reducers, one per state
  chain(
  	// chain receives tuple of functions, one per reducer
  	...reducers.map((reducer, idx) =>
  		// nth CPS function inside chain receives nth callback output of cpsAction
  		(...action) => (...cbs) => {
      // accessing states and reducers by index
      states[idx] = reducer(states[idx], ...action)
      cbs[idx]( states[idx] )    		
  	}
  ))(cpsAction)




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
