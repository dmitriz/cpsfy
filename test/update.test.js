const test = require('./config')
const { update } = require('..')

test('update transforms simple reducer to updater', t=>{
	const add = update((state,v)=>state+v)(10)
	t.is(add(1),10+1)
	t.is(add(2),10+1+2)
	t.is(add(-1),10+1+2-1)
})

test('update works with reducer with variadic tuples of values', t=>{
	const concat = update((arr, ...rest) => [...arr, ...rest])([0])
	t.deepEqual(concat(1),[0,1])
	t.deepEqual(concat(),[0,1])
	t.deepEqual(concat(1,2,3),[0,1,1,2,3])
})
