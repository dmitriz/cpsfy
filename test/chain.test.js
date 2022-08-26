const test = require('./config')
const { chain } = require('..')

test('chain over single CPS function', t => {
	const cpsFun = cb => cb(42)
	const cpsNew = chain(x => cb => cb(x*2))(cpsFun)
	// 84 passed as output into the first callback
	cpsNew(t.cis(84))
})

test('chain over single CPS function with several arguments', t => {
	// (5, 2) passed as output into the first callback
	const cpsFun = cb => cb(5, 2)
	const cpsNew = chain(
		(a, b) => cb => cb(a - b)
	)(cpsFun)
	// new output is 3 = 5 - 2
	cpsNew(t.cis(3))	
})

test('all repeated outputs are passed', t => {
	const cpsFun = cb => { cb(42); cb(42) }
	const cpsNew = chain(x => cb => cb(x + 1))(cpsFun)
	// the callback t.cis(43) must be executed twice
	t.plan(2)
	cpsNew(t.cis(43))
})

test('also all repeated outputs passed from transforming functions', t => {
	const cpsFun = cb => { cb(42) }
	const cpsNew = chain(
		// cb is called twice - 2 outputs
		x => cb => cb(x + 1) + cb(x + 1)
	)(cpsFun)
	// the callback t.cis(43) must be executed twice
	t.plan(2)
	cpsNew(t.cis(43))
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

test('all callbacks passed when chain over single function', t => {
	// 42 is passed as output
	const cpsFun = cb => cb(42)
	const cpsNew = chain(
		x => (cb1, cb2) => {
			cb1(x * 2)
			cb2(x + 10)
		})(cpsFun)
	// 84 passed into the first, and 52 into the second callback
	t.plan(2)
	cpsNew(t.cis(84), t.cis(52))
})

test('chain over multiple functions with the same output twice', t => {
	// 42 and 10.5 passed respectively into the first and second callback
	const cpsFun = (cb1, cb2) => cb1(42) + cb2(10.5)
	// both output are transformed into the same result
	const cpsNew = chain(
		x => cb => cb(x/2), 
		x => cb => cb(x*2)
	)(cpsFun)
	t.plan(2)
	cpsNew(t.cis(21))	
})

test('chain over multiple functions merges the outputs', t => {
	// one output for each callback
	let called = false
	const cpsFun = (cb1, cb2) => { cb1(2); cb2(5) }
	const newCps = chain(
		// output 42 is passed here
		x => cb => cb(x/2), 
		// output 21 is passed here
		x => cb => cb(x*2)
	)(cpsFun)

	// called twice - with 21 and 42 as outputs
	t.plan(2)
	newCps(res => {
		t.cis(called ? 10 : 1)(res)
		called = true
	})	
})

test('multiple callbacks from transforming functions merge by index', t => {
	const cpsFun = (cb1, cb2) => { cb1(8); cb2(2) }
	const newCps = chain(
		// output 8 is passed here as x
		x => (c1, c2) => c1(x/2) + c2(x), 
		// output 2 is passed here as x
		x => (cb1, cb2) => cb1(x*2) + cb2(x*4),
	)(cpsFun)

	// each callback is called twice
	t.plan(4)
	newCps(
		// 4 = 8/2 = 2*2 is passed twice, once from each of c1 and cb1
		t.cis(4),
		// 8 = 8 = 2*4 is passed twice, once from each of c2 and cb2
		t.cis(8)
	)
})

test('chain over fewer fns than cbs should preserve the extra outputs', t => {
	t.plan(2)
	const cpsFun = (cb1, cb2) => { cb1(0); cb2(2) }
	chain(x => cb => cb(x + 1))(cpsFun)(t.cis(1), t.cis(2))
})

test('missing functions inside chain preserve outputs', t=>{
	const cpsFun = (cb1, cb2) => { cb1(0); cb2(2) }
	chain()(cpsFun)(t.cis(0), t.cis(2))
})

test('nill values in place of functions preserve outputs', t=>{
	const cpsFun = (cb1, cb2) => { cb1(0); cb2(2) }
	chain(undefined, x => (cb1,cb2) => cb2(x + 1))(cpsFun)(t.cis(0), t.cis(3))
	chain(null, x => (cb1,cb2) => cb2(x + 1))(cpsFun)(t.cis(0), t.cis(3))
	chain(null, null)(cpsFun)(t.cis(0), t.cis(2))
})

test('further functions inside chain are ignored', t=>{
	const cpsFun = (cb1, cb2) => { cb1(0); cb2(2) }
	chain(null, null, _ => notCalled )(cpsFun)(t.cis(0), t.cis(2))	
})

