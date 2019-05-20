const test = require('./config').test
const { of } = require('..')

test('create CPS functions with single output', t => {
	of(42)(t.cis(42))
})

test('create CPS with multi-arg output', t => {
	t.is(
		of(2, 7)((x,y) => x + y),
		9
	)
})
