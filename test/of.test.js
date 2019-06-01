const test = require('./config')
const { of } = require('..')

test('create CPS functions with single output', t => {
	of(42)(t.cis(42))
})

test('create CPS with multi-arg output', t => {
	of(2, 7)((x, y) => {
		t.is(x, 2)
		t.is(y, 7)
	})
})

test('no output is passed to the 2nd and following callbacks', t => {
	t.plan(0) //no test will be run
	of(55)(x => x, t.cis(42))
	of(3,2,1)(x => x, t.cis(42))
})
