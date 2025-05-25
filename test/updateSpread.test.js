const test = require('./helpers/ava-patched')
const { updateSpread } = require('..')

test('updateSpread transforms simple curried reducer that returns array', t=>{
	const add = updateSpread(state => v =>[state+v])(10)
	t.deepEqual(add(1),[10+1])
	t.deepEqual(add(2),[10+1+2])
	t.deepEqual(add(-1),[10+1+2-1])
})

test('updateSpread works with curried reducer with variadic tuples of values', t=>{
	const concat = updateSpread((...arr) => (...vals) => [...arr, ...vals])(0,0)
	t.deepEqual(concat(1),[0,0,1])
	t.deepEqual(concat(),[0,0,1])
	t.deepEqual(concat(1,2,3),[0,0,1,1,2,3])
})
