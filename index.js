/**
 * Pipeline Operator
 * 
 * based on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Pipeline_operator
 * but additionally allows passing tuples of functions as curried arguments: write pipeline chain  
 *		x |> f1 |> f2 |> ... |> fn
 * compactly as single function call
 * 		pipeline(x)(f1, f2, ..., fn)
 * 
 * @name pipeline
 * @params {Tuple} (...args) tuple of arbitrary values
 * @curriedParams {Tuple of Functions} (...fns) tuple of functions that
 * @returns fn(...f2(f1(...args))...) 
 *		where (...fns) = (f1, f2, ..., fn)
 *
 * @example
 * pipeline(x,y)(f, g)
 *		is equivalent to g(f(x, y))
 */
const pipeline = (...args) => (...fns) => {
	const f1 = fns[0]
	return fns.slice(1).reduce(
		(acc, fn) => fn(acc),
		f1(...args)
	)
}


/* ----- CPS operators ----- */

// Ensure all methods are inherited via prototype
const inheritState = (target, source) => {
	Object.setPrototypeOf(
		target, Object.getPrototypeOf(source)
	)
}

/**
 * Create CPS function with given tuple as immediate output
 *
 * @name CPS.of
 * @params {Tuple} (...args) tuple of arbitrary values
 * @returns {CPS Function} CPS.of(...args) that outputs (...args) inside its first callback
 *
 * @example
 * CPS.of(x1, x2, x3)
 * 		is equivalent to CPS function 
 * cb => cb(x1, x2, x3)
 *
 * Along with CPS.map conforms to the Pointed Functor spec, see https://stackoverflow.com/a/41816326/1614973
 */
const of = (...args) => cb => cb(...args)


/**
 * Map CPS function over arbitrary tuple of functions
 * 
 * @signature (...fns) -> CPS -> CPS (curried)
 *
 * @name CPS.map
 * @params {Tuple of Functions} (...fns)
 * @curriedParam {CPS Function} cpsFun
 * @returns {CPS Function} whose nth callback's output equals the nth callback's output of `cpsFun` transformed with nth function
 *
 * @example
 * const cpsFun = (cb1, cb2) => cb1(2, 3) + cb2(7)
 *		is CPS function with 2 callbacks and outputs (2, 3) and (7) passed into corresponding callbacks
 * CPS.map(f1, f2)(cpsFun)
 *		is equivalent to the CPS function
 * (cb1, cb2) => cb1(f1(2, 3)) + cb2(f2(7))
 * 		where f1 and f2 transform respective outputs
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
 * Chains outputs of a CPS function with arbitrary tuple of CPS functions
 * 
 * @signature (...cpsFns) -> CPS -> CPS (curried)
 * @params {Tuple of CPS Functions} (...cpsFns)
 * @curriedParam {CPS Function} cpsFun
 * @returns {CPS Function} whose nth callback's output equals the nth callback's output of `cpsFun` transformed with nth function
 *
 * @example
 * const cpsFun = (cb1, cb2) => cb1(2, 3) + cb2(7, 9)
 *		is CPS function with 2 callbacks and outputs (2, 3) and (7, 9) passed into corresponding callbacks
 * const cpsF1 = (x, y) => (cb1, cb2) => { cb1(x + y); cb2(x - y) }
 * const cpsF2 = (x, y) => cb => cb(x, -y)
 *
 * CPS.map(cpsF1, cpsF2)(cpsFun)
 *		is equivalent to the CPS function
 * (cb1, cb2) => cb1(5) + cb2(7, -9)
 */
const chain = (...cpsFns) => cpsFun => {
	let cpsNew = (...cbs) => cpsFun(
		// precompose every callback with fn matched by index or pass directly the args,
		// collect functions in array and pass as callbacks to cpsFun
		...cpsFns.map(
			// all callbacks get passed to each cpsFn
			cpsFn => (...args) => cpsFn(...args)(...cbs)
		)
	)
	inheritState(cpsNew, cpsFun)
	return cpsNew	
}


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

module.exports = { pipeline, of, map, chain, CPS }
