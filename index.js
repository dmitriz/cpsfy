/**
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
 *
 * multiple args:
 *		pipeline(x,y)(f)
 * is equivalent to
 *		f(x, y)
 */
const pipeline = (...args) => (...fns) => {
	const f1 = fns[0]
	return fns.slice(1).reduce(
		(acc, fn) => fn(acc),
		f1(...args)
	)
}


/* ----- CPS operators ----- */

// [[a]] -> CPS
// 		of(x1, x2, ...) 
// is equivalent to
// 		cb => cb(x1, x2, ...)
const of = (...args) => cb => cb(...args)

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

const CPS = cpsFn => ({
	map: (...args) => map(...args)(cpsFn),
	chain: (...args) => chain(...args)(cpsFn)
})

module.exports = { pipeline, of, map, chain, CPS }
