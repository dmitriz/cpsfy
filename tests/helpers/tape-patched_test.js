const test = require('./tape-patched')

test('test equality as curried function', t => {
	t.cis(2)(2)
})
