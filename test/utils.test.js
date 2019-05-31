const test = require('./config')
const { mergeArray } = require('../utils')

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
