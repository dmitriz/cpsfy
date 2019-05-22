const test = require('./config').test
const { chain } = require('..')

test('chain over single CPS function', t => {
	const cpsFun = cb => cb(42)
	const cpsNew = chain(x => cb => cb(x*2))(cpsFun)
	// 84 passed as output into the first callback
	cpsNew(t.cis(84))
})

test('chain over single CPS function with several arguments', t => {
	// (42, 24) passed as output into the first callback
	const cpsFun = cb => cb(42, 24)
	const cpsNew = chain(
		(a, b) => cb => cb(a - b)
	)(cpsFun)
	// new output is 18
	cpsNew(t.cis(18))	
})

test('chain over single function with no arguments', t => {
	// empty tuple as output
	const cpsFun = cb => cb()
	// transform empty tuple into 30 as output
	const cpsNew = chain(
		() => cb => cb(30)
	)(cpsFun)
	// new output is 30
	cpsNew(t.cis(30))	
})

test('all callbacks passed when chain with single function', t => {
	// 42 is passed as output
	const cpsFun = cb => cb(42)
	const cpsNew = chain(
		x => (cb1, cb2) => {
			cb1(x * 2)
			cb2(x + 10)
		})(cpsFun)
	// 84 passed into the first, and 52 into the second callback
	cpsNew(t.cis(84), t.cis(52))
})

test('chain over multiple functions with the same output twice', t => {
	// 42 and 10.5 passed respectively into the first and second callback
	const cpsFun = (cb1, cb2) => {
		cb1(42)
		cb2(10.5)
	}
	const cpsNew = chain(
		x => cb => cb(x/2), 
		x => cb => cb(x*2)
	)(cpsFun)
	cpsNew(t.cis(21))	
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
