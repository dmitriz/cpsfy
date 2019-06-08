const test = require('./config')
const { ap } = require('..')

const notCalled = () => {throw Error('I should not be called!')}

test('ap over single CPS function', t => {
	const cpsFun = cb => cb(42)
	const cpsNew = ap(cb => cb(x => x*2))(cpsFun)
	// 84 passed as output into the first callback
	cpsNew(t.cis(84))
})

test('ap over single CPS function with several arguments', t => {
	// (5, 2) passed as output into the first callback
	const cpsFun = cb => cb(5, 2)
	const cpsNew = ap(
		cb => cb((a, b) => a - b)
	)(cpsFun)
	// new output is 3 = 5 - 2
	cpsNew(t.cis(3))
})

test('ap of single CPS function with no arguments', t => {
	// empty tuple as output
	const cpsFun = cb => cb()
	// transform empty tuple into 30 as output
	const cpsNew = ap(
		cb => cb(() => 30)
	)(cpsFun)
	// new output is 30
	cpsNew(t.cis(30))	
})

test('ap of function with multiple callbacks called', t => {
	const cpsFun = (cb1, cb2) => {cb1(1); cb2(12)}
	const cpsNew = ap(
		cb => cb(x => x + 1)
	)(cpsFun)
	t.plan(2)
	cpsNew(t.cis(2), t.cis(12))
})


test('ap of 2-callback-CPS over single function is passing 2nd callback unchanged', t => {
	const cpsFun = (cb, onErr) => {onErr('error')}
	const cpsNew = ap(cb => cb(11))(cpsFun)
	t.plan(1)
	cpsNew(notCalled, t.cis('error'))
})


test('ap only applies to callbacks with output', t => {
	const cpsFun = (cb, onErr) => {onErr('error')}
	const cpsNew = ap(
		cb => {cb(x => x + 1)},
		onErr => {onErr(err => 'logs ' + err)}
	)(cpsFun)
	t.plan(1)
	cpsNew(
		notCalled,  
		t.cis('logs error'))
})


// test('ap over pair of functions applies to outputs from separate callbacks', t => {
// 	const cpsFun = (cb, onErr) => {cb(1); onErr('error')}
// 	const cpsNew = ap(
// 		cb => {cb(x => x + 1)},
// 		onErr => {onErr(err => 'logs ' + err)}
// 	)(cpsFun)
// 	t.plan(2)
// 	cpsNew(t.cis(11),  t.cis('logs error'))
// })


// test('chain over multiple functions with the same output twice', t => {
// 	// 42 and 10.5 passed respectively into the first and second callback
// 	const cpsFun = (cb1, cb2) => cb1(42) + cb2(10.5)
// 	// both output are transformed into the same result
// 	const cpsNew = chain(
// 		x => cb => cb(x/2), 
// 		x => cb => cb(x*2)
// 	)(cpsFun)
// 	t.plan(2)
// 	cpsNew(t.cis(21))	
// })

// test('chain over multiple functions merges the outputs', t => {
// 	// one output for each callback
// 	let called = false
// 	const cpsFun = (cb1, cb2) => { cb1(2); cb2(5) }
// 	const newCps = chain(
// 		// output 42 is passed here
// 		x => cb => cb(x/2), 
// 		// output 21 is passed here
// 		x => cb => cb(x*2)
// 	)(cpsFun)

// 	// called twice - with 21 and 42 as outputs
// 	t.plan(2)
// 	newCps(res => {
// 		t.cis(called ? 10 : 1)(res)
// 		called = true
// 	})	
// })

// test('ap over transforming functions with multiple callbacks merge by index', t => {
// 	const cpsFun = (cb1, cb2) => { cb1(8); cb2(2) }
// 	const newCps = ap(
// 		(c1, c2) => {c1(x => x/2); c2(x => x*2)}, 
// 	)(cpsFun)
// 	// each callback is called twice
// 	t.plan(4)
// 	newCps(
// 		// 4 = 8/2 = 2*2 is passed twice, once from each of c1 and cb1
// 		t.cis(4),
// 		// 8 = 8 = 2*4 is passed twice, once from each of c2 and cb2
// 		t.cis(8)
// 	)
// })

// test('chain over fewer fns than cbs should preserve the extra outputs', t => {
// 	t.plan(2)
// 	const cpsFun = (cb1, cbb) => { cb1(0); cbb(2) }
// 	chain(x => cb => cb(x + 1))(cpsFun)(t.cis(1), t.cis(2))
// })
