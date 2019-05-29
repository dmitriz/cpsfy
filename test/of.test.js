const test = require('./config').test
const { of } = require('..')

test('create CPS functions with single output', t => {
	of(42)(t.cis(42))
})

test('create CPS with multi-arg output', t => {
	// callback to test that x + y = 9
	const callback = (x, y) => t.cis(9)(x + y)	
	of(2, 7)(callback)
})

test('no output is passed to the 2nd and following callbacks', t => {
	t.plan(0) //no test will be run
	of(55)(x => x, t.cis(42))
	of(3,2,1)(x => x, t.cis(42))
})