/*
Curried version of the `.is` assertion
https://github.com/avajs/ava/blob/master/docs/03-assertions.md#isvalue-expected-message

Usage: t.cis(a)(b) instead of t.is(a, b)
*/
const test = require('ava')

// patching test object with `.cis` prop to delegate to its `.is` prop
module.exports = (title, fn) =>	
	test(title, t => {
		t.cis = a => b => t.is(a, b)
		return fn(t)
	})
