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

// add method to object by delegating to curried function applied to it
// const fn2method => (obj, name, fn) => {
// 	obj[name] = (...args) => fn(...args)(obj)
// 	return obj
// }

// // CPS adds the methods to its argument
// const methods = { map, chain }
// const CPS = cpsFun => Object.keys(methods).reduce(
// 	(acc, fnName) => fn2method(acc, fnName, methods[fnName])
// 	cpsFun
// )

module.exports = { of, map, chain }
