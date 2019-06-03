const test = require('ava')

/*
Curried version of the `.is` assertion: patching test object with `.cis` prop to delegate to its `.is` prop
https://github.com/avajs/ava/blob/master/docs/03-assertions.md#isvalue-expected-message

Usage: t.cis(a)(b) instead of t.is(a, b)
*/
module.exports = (title, fn) =>	
	test(title, t => {
		t.cis = a => b => t.is(a, b)
		t.cDeepEqual = a => b => t.deepEqual(a, b)
		return fn(t)
	})
