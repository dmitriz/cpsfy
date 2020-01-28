const test = require('./config')
const { curry2 } = require('..')

test('curry 2 arg function', t => {
	t.is( curry2((a,b)=>a+b)(1)(2), 3)
})

test('curry 3 arg function', t => {
  t.is( curry2((a,b,c)=>a+b+c)(1,2)(3), 6)
})
