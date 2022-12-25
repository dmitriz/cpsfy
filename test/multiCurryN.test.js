const test = require('./config')
const { multiCurryN } = require('..')

const add = (x,y)=>x+y
const collect = (...args) => args

test('multiCurryN(1) does not change function', t=>{
	t.is(multiCurryN(1)(add)(11,22), 11+22)
	t.deepEqual(multiCurryN(1)(collect)(11,22), [11,22])
})

test('multiCurryN applied to 2 groups of args', t=>{
	t.deepEqual(multiCurryN(2)(collect)(11)(22), [11,22])
	t.deepEqual(multiCurryN(2)(collect)(11,2)(22,3,1), [11,2,22,3,1])
})

test('multiCurryN applied to 3 groups of args', t=>{
	t.deepEqual(multiCurryN(3)(collect)(11,2)(22)(3,1), [11,2,22,3,1])
})

test('multiCurryN applied to 4 groups of args', t=>{
	t.deepEqual(multiCurryN(4)(collect)(11,2)(22)(3)(1), [11,2,22,3,1])
})
