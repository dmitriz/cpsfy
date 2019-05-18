const test = require('./curried-test')

test('test equality as curried function', t => {
	t.cis(2)(2)
})
