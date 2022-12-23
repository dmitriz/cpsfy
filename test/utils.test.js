const test = require('./config')
const { isNil, mergeArray } = require('../utils')

test('isNil is true for null or undefined', t=>{
	t.is(isNil(undefined), true)
	t.is(isNil(null), true)
})
test('isNil is false for values other than null or undefined', t=>{
	t.is(isNil(NaN), false)
	t.is(isNil(0), false)
	t.is(isNil(10), false)
	t.is(isNil([]), false)
	t.is(isNil([1]), false)
	t.is(isNil({}), false)
	t.is(isNil({a:1}), false)
})


test('merge longer array into shorter', t => {
	t.deepEqual(
		mergeArray([1,2], [3,4,5]),
		[1,2,5]
	)
})

test('merge into empty array', t => {
	t.deepEqual(mergeArray([], [1,2]), [1,2])
})

test('no change for arrays of equal length', t => {
	t.deepEqual(mergeArray([1], [2]), [1])
})

test('take the 1st array when both are of equal length', t => {
	t.deepEqual(mergeArray([1], [2]), [1])
})

test('take the 1st array when the 2nd has smaller length', t => {
	t.deepEqual(mergeArray([1,3], [2]), [1,3])
})
