const test = require('ava')

module.exports = (title, fn) =>	
	test(title, t => {
		t.cis = a => b => t.is(a, b)
		return fn(t)
	})
