const test = require('./helpers/ava-patched')
const { err2cb, stream2lines } = require('..')
const { isNil, mergeArray } = require('../utils')

const { Readable } = require('node:stream')

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


test('err2cb preserves cps function without errors', t=>{
	t.plan(5)
	const cpsF1 = c=>c(2)
	const cpsF2 = (c1,c2)=>{c1(2);c2(4)}
	err2cb(cpsF1)(t.cis(2), _=>notCalled)
	err2cb(cpsF1,1)(t.cis(2))
	err2cb(cpsF1,2)(t.cis(2), _=>notCalled)
	err2cb(cpsF2)(t.cis(2),t.cis(4))
})
test('err2cb outputs error to 2nd callback by default', t=>{
	t.plan(2)
	const cpsF1 = c => bad
	t.throws(cpsF1)
	err2cb(cpsF1)(_=>notCalled, e => {t.is(typeof e, 'object')}) 
})

test('stream2lines transforms stream without returns to its content', async t=>{
	t.plan(1)
	const stream = Readable.from('abc', {objectMode: false})
	await new Promise((onRes, onErr)=> 
		stream2lines(stream)(t.cis('abc'), onErr, onRes)
	)
})
test('stream2lines transforms stream with returns to multiple outputs', async t=>{
	t.plan(2)
	const stream = Readable.from('abc\nabc', {objectMode: false})
	await new Promise((onRes, onErr)=>
		stream2lines(stream)(t.cis('abc'),onErr, onRes)
	)
})


