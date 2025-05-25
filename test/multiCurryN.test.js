const test = require('./helpers/ava-patched')
const { curryGroupsN } = require('..')

const add = (x,y)=>x+y
const collect = (...args) => args

test('curryGroupsN(1) does not change function', t=>{
	t.is(curryGroupsN(1)(add)(11,22), 11+22)
	t.deepEqual(curryGroupsN(1)(collect)(11,22), [11,22])
})

test('curryGroupsN applied to 2 groups of args', t=>{
	t.deepEqual(curryGroupsN(2)(collect)(11)(22), [11,22])
	t.deepEqual(curryGroupsN(2)(collect)(11,2)(22,3,1), [11,2,22,3,1])
})

test('curryGroupsN applied to 3 groups of args', t=>{
	t.deepEqual(curryGroupsN(3)(collect)(11,2)(22)(3,1), [11,2,22,3,1])
})

test('curryGroupsN applied to 4 groups of args', t=>{
	t.deepEqual(curryGroupsN(4)(collect)(11,2)(22)(3)(1), [11,2,22,3,1])
})
