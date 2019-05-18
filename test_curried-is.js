const test = require('./curried-is')

test('test equality as curried function', t => {
	t.cis(2)(2)
})
