const test = require('ava')
const {of, chain} = require('.')

test('chain over single CPS function', t => {
	const cpsFun = cb => cb(42)
	const chainedCpsFun = chain(x => cb => cb(x*2))(cpsFun)
	chainedCpsFun(res => t.is(res, 84))
})

test('chain over single CPS function with several arguments', t => {
	const cpsFun = cb => cb(42, 24)
	const chainedCpsFun = chain((a, b) => cb => cb(a - b))(cpsFun)
	chainedCpsFun(res => t.is(res, 18))	
})

test('chain over single function with no arguments', t => {
	const cpsFun = cb => cb()
	const chainedCpsFun = chain(() => cb => cb(30))(cpsFun)
	chainedCpsFun(res => t.is(res, 30))	
})

test('all callbacks passed when chain over single function', t => {
	const cpsFun = cb => cb(42)
	const chainedCpsFun = chain(x => (cb1, cb2) => {cb1(x*2); cb2(x+10)})(cpsFun)
	chainedCpsFun(res => t.is(res, 84), res => t.is(res, 52))
})

test('chain over multiple functions with the same output twice', t => {
	const cpsFun = (cb1, cb2) => {cb1(42); cb2(10.5)}
	const chainedCpsFun = chain(x => cb => cb(x/2), x => cb => cb(x*2))(cpsFun)
	chainedCpsFun(res => t.is(res, 21))	
})

test('chain over multiple functions merges the outputs', t => {
	// one output for each callback
	const cpsFun = (cb1, cb2) => {cb1(42); cb2(21)}
	const chainedCpsFun = chain(
		// output 42 is passed here
		x => cb => cb(x/2), 
		// output 21 is passed here
		x => cb => cb(x*2)
	)(cpsFun)
	let called = false
	chainedCpsFun(res => {
		t.is(res, called ? 42 : 21)
		called = true
	})	
})
