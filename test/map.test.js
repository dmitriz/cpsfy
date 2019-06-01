const test = require('./config')
const { map } = require('..')

test('map over single function', t => {
	const cpsFun = cb => cb(42)
	map(x => x*2)(cpsFun)(t.cis(84))
})

test('map over single function with several arguments', t => {
	const cpsFun = cb => cb(42, 24)
	map((a, b) => a - b)(cpsFun)(t.cis(18))	
})

test('map over single function with no arguments', t => {
	const cpsFun = cb => cb()
	map(() => 30)(cpsFun)(t.cis(30))	
})

test('further callbacks are unaffected when map over single function', t => {
	const cpsFun = (cb1, cb2) => {cb1(42); cb2(23)}
	map(x => x*2)(cpsFun)(x => x, t.cis(23))	
})

test('map over multiple functions', t => {
	t.plan(2)
	const cpsFun = (cb1, cb2) => {cb1(42); cb2(23)}
	map(x => x/2, x => x*2)(cpsFun)(t.cis(21), t.cis(46))	
})

test('map over more functions than callbacks, the extra functions are ignored', t => {
	const cpsFun = cb => cb(42)
	map(x => x*2, x => x+10)(cpsFun)(t.cis(84))	
})
