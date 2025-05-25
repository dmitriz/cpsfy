const test = require('./helpers/ava-patched')
const { pipe } = require('..')

test('pass single argument to single function', t => {
	t.is(pipe(x => x + 2)(1), 3)
})

test('pass multiple arguments to single function', t => {
	t.is(pipe(
		(x, y) => x + y
	)(1, 5), 6)
	t.is(pipe(
		(x, y, z) => x + y - z
	)(1, 2, 5), -2)
})

test('chain multiple functions with single argument', t => {
	t.is(pipe(
		x => x + 1,
		y => y - 2
	)(2), 1)
	t.is(pipe(
		x => x + 1,
		y => y - 2,
		z => z * 2
	)(2), 2)
})

test('chain multiple functions with multiple args', t => {
	t.is(pipe(
		(x, y) => x + y,
		z => z * 2
	)(1, 3), 8)
})
