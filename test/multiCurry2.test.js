const test = require('./config')
const { multiCurry2 } = require('..')

test('multiCurry2 arg function', t => {
	t.is( multiCurry2((a,b)=>a+b)(1)(2), 3)
})

test('multiCurry2 3 arg function', t => {
  t.is( multiCurry2((a,b,c)=>a+b+c)(1,2)(3), 6)
})
