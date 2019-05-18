const test = require('./curried-is')
const { chain } = require('.')

test('chain over single CPS function', t => {
	const cpsFun = cb => cb(42)
	chain(x => cb => cb(x*2))(cpsFun)(t.cis(84))
})

test('chain over single CPS function with several arguments', t => {
	const cpsFun = cb => cb(42, 24)
	chain((a, b) => cb => cb(a - b))(cpsFun)(t.cis(18))	
})

test('chain over single function with no arguments', t => {
	const cpsFun = cb => cb()
	chain(() => cb => cb(30))(cpsFun)(t.cis(30))	
})

test('all callbacks passed when chain over single function', t => {
	const cpsFun = cb => cb(42)
	chain(x => (cb1, cb2) => {cb1(x*2); cb2(x+10)})(cpsFun)(t.cis(84), t.cis(52))
})

test('chain over multiple functions with the same output twice', t => {
	const cpsFun = (cb1, cb2) => {cb1(42); cb2(10.5)}
	chain(x => cb => cb(x/2), x => cb => cb(x*2))(cpsFun)(t.cis(21))	
})

test('chain over multiple functions merges the outputs', t => {
	// one output for each callback
	const cpsFun = (cb1, cb2) => {cb1(42); cb2(21)}
	let called = false
	chain(
		// output 42 is passed here
		x => cb => cb(x/2), 
		// output 21 is passed here
		x => cb => cb(x*2)
	)(cpsFun)
	(res => {
		t.is(res, called ? 42 : 21)
		called = true
	})	
})

test('return value is unchanged after chaining', t => {
	const cpsFun = cb => {cb(42); return 11}
	t.is( 11, chain(x => cb => x*2)(cpsFun)(x=>x) )
	t.is( 11, chain(x => (cb1, cb2) => {cb1(x*2); cb2(x+1) })(cpsFun)(x=>x, x=>x) )
})

