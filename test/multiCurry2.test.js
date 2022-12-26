const test = require('./config')
const { curryGroups2 } = require('..')

test('curryGroups2 arg function', t => {
	t.is( curryGroups2((a,b)=>a+b)(1)(2), 3)
})

test('curryGroups2 3 arg function', t => {
  t.is( curryGroups2((a,b,c)=>a+b+c)(1,2)(3), 6)
})
