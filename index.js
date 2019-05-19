// [[a]] -> CPS
const of = (...arrays) => (...cbs) => {
	arrays.forEach(
		(array, idx) => cbs[idx] && cbs[idx](...array)
	)	
}

// (...fns) -> CPS -> CPS
const map = (...fns) => cpsFun =>
	(...cbs) => cpsFun(
		// precompose every callback with fn matched by index or pass directly the args
		// collect functions in array and pass as callbacks to cpsFun
		...cbs.map(
			(cb, idx) => (...args) => fns[idx] ? cb(fns[idx](...args)) : cb(...args)
		)
	)

// (...fns) -> CPS -> CPS
const chain = (...cpsFns) => cpsFun =>
	(...cbs) => cpsFun(
		// precompose every callback with fn matched by index or pass directly the args
		// collect functions in array and pass as callbacks to cpsFun
		...cpsFns.map(
			// all callbacks get passed to each cpsFn
			cpsFn => (...args) => cpsFn(...args)(...cbs)
		)
	)

/* 
 * Pipeline Operator
 * based on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Pipeline_operator
 * but additionally allows passing a chain of functions
 * 
 * write pipe chain  
 *		x |> f1 |> f2 |> ... |> fn
 * compactly as single function call
 * 		pipeline(x)(f1, f2, ..., fn)
 * which is equivalent to
 * 		fn(...f2(f1(x))...)
 */
const pipeline = (...args) => (...fns) =>
	...fns.reduce(
		(acc, fn) => fn(acc),
		...args
	)


module.exports = { of, map, chain }
