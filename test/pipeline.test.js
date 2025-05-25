const test = require('./helpers/ava-patched')
const { pipeline } = require('..')

test('pass single argument to function', t => {
	t.is(pipeline(1)(x => x + 2), 3)
})

test('pass multiple arguments to function', t => {
	t.is(pipeline(1, 5)(
		(x, y) => x + y
	), 6)
	t.is(pipeline(1, 2, 5)(
		(x, y, z) => x + y - z
	), -2)
})

test('chain multiple functions', t => {
	t.is(pipeline(2)(
		x => x + 1,
		y => y - 2
	), 1)
	t.is(pipeline(2)(
		x => x + 1,
		y => y - 2,
		z => z * 2
	), 2)
})

test('chain multiple functions with multiple args', t => {
	t.is(pipeline(1, 3)(
		(x, y) => x + y,
		z => z * 2
	), 8)
})
