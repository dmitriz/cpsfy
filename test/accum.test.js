const test = require('./config')
const { accum } = require('..')

test('accum transforms simple reducer to accumulator', t=>{
	const add = accum((state,v)=>state+v)(10)
	t.is(add(1),10+1)
	t.is(add(2),10+1+2)
	t.is(add(-1),10+1+2-1)
})

test('accum works with reducer with variadic tuples of values', t=>{
	const concat = accum((arr, ...rest)=>arr.concat(rest))([0])
	t.deepEqual(concat(1),[0,1])
	t.deepEqual(concat(),[0,1])
	t.deepEqual(concat(1,2,3),[0,1,1,2,3])
})
