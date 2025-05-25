const test = require('./helpers/ava-patched')
const { ofN } = require('..')

test('single output into the 1st callback', t => {
	ofN(0)(42)(t.cis(42))
})

test('single output into the 2nd callback', t => {
	ofN(1)(42)(() => {}, t.cis(42))
})

test('multi-arg output into the 3rd callback', t => {
	ofN(2)(2, 7)(() => {}, () => {}, (x, y) => {
		t.is(x, 2)
		t.is(y, 7)
	})
})

test('no output is passed to the 2nd callback', t => {
	t.plan(0) //no test will be run
	ofN(1)(5)(t.cis(42), () => {})
	ofN(3,2,1)(t.cis(42), () => {})
})
