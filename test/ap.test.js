const test = require('./helpers/ava-patched')
const { ap } = require('..')

const notCalled = () => {throw Error('I should not be called!')}

test('ap over single CPS function applies function to output', t => {
	const cpsFun = cb => {cb(42)}
	const cpsNew = ap(cb => cb(x => x*2))(cpsFun)
	// 84 passed as output into the first callback
	cpsNew(t.cis(84))
})

test('ap of single CPS function with multiple callbacks', t => {
	const cpsFun = cb => {cb(2)}
	const cpsNew = ap(
		(cb1, cb2) => {cb1(x => x+1); cb2(x => x-1)} 
	)(cpsFun)
	t.plan(2)
	// apply both output functions to x and pass into respective callbacks
	cpsNew(t.cis(3), t.cis(1))
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

test('ap of function with multiple callbacks over single function only affects first callback output', t => {
	const cpsFun = (cb1, cb2) => {cb1(1); cb2(12)}
	const cpsNew = ap(
		cb => cb(x => x + 1)
	)(cpsFun)
	t.plan(2)
	cpsNew(t.cis(2), t.cis(12))
})

test('ap over 2 functions with multiple callbacks passed into separate callbacks', t => {
	const cpsFun = (cb1, cb2) => {cb1(1); cb2(12)}
	const cpsNew = ap(
		cb => cb(x => x + 1), 
		(cb1,cb2) => cb2(x => x - 1)
	)(cpsFun)
	t.plan(2)
	cpsNew(t.cis(2),t.cis(11))
})

test('ap over 2 functions with multiple callbacks passed into the same callback', t => {
	const cpsFun = (cb1, cb2) => {cb1(1); cb2(3)}
	const cpsNew = ap(
		(cb1,cb2) => cb2(x => x + 1), 
		(cb1,cb2) => cb2(x => x - 1)
	)(cpsFun)
	t.plan(2)
	// only 2nd callback is called twice
	cpsNew(notCalled,t.cis(2))
})

test('ap of 2-callback-CPS over single function is passing 2nd callback unchanged', t => {
	const cpsFun = (cb, onErr) => {onErr('error')}
	const cpsNew = ap(cb => cb(notCalled))(cpsFun)
	t.plan(1)
	cpsNew(notCalled, t.cis('error'))
})

test('ap allows handle errors passing into first callback', t => {
	const cpsFun = (cb, onErr) => {onErr('error')}
	const cpsNew = ap(
		cb => {cb(x => x + 1)},
		onErrUpdate => {onErrUpdate(err => err + ' is logged')}
	)(cpsFun)
	t.plan(1)
	cpsNew(t.cis('error is logged'), notCalled)
})

test('works when function is returned earlier than value', t => {
	let callback = () => {}
	const cpsFun = cb => { callback = cb }
	const transformer = cb => cb(x => x + 1)
	ap(transformer)(cpsFun)(t.cis(6))
	// ensure call after transformer
	callback(5)
})

test('works when value is returned earlier than function', t => {
	let callback = () => {}
	const cpsFun = cb => cb(1)
	const transformer = cb => { callback = cb }
	ap(transformer)(cpsFun)(t.cis(4))
	// ensure call after transformer
	callback(x => x + 3)
})

