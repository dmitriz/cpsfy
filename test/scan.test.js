const test = require('./helpers/ava-patched')
const { update, map, scan, scanS } = require('..')

test('scan over single callback output', t => {
	const reducer = (acc, x) => acc + x
	const cpsFun = cb => cb(42)
	t.plan(1)
	scan(10)(reducer)(cpsFun)(t.cis(10+42))
})
test('scan with more seeds than reducers', t => {
	const reducer = (acc, x) => acc + x
	const cpsFun = cb => {cb(42)}
	t.plan(1)
	scan(10,12)(reducer)(cpsFun)(t.cis(10+42))
})
test('scan over single callback preserves outputs from other callbacks', t => {
	const reducer = (acc, x) => acc + x
	const cpsFun = (c1,c2) => {c1(42);c2(5)}
	t.plan(2)
	scan(10)(reducer)(cpsFun)(t.cis(10+42),t.cis(5))
})
test('scan ignores undefined/null function args', t => {
	const r = (acc, x) => acc + x
	const cpsFun = (c1,c2) => {c1(42)}
	const cpsFun1 = (c1,c2) => {c2(42)}
	const cpsFun2 = (c1,c2) => {c1(2);c2(11)}
	t.plan(5)
	scan(10)(null, r)(cpsFun)(t.cis(42))
	scan(10)(undefined, r)(cpsFun)(t.cis(42))
	scan(null,10)(undefined, r)(cpsFun1)(null,t.cis(10+42))
	scan(null,10)(undefined, r)(cpsFun2)(t.cis(2),t.cis(10+11))
})
test('scan over single repeated callback output', t => {
	let called = false
	const reducer = (acc, x) => acc + x
	const cpsFun = cb => { cb(2); cb(8) }
	const newCps = scan(10)(reducer)(cpsFun)
	t.plan(2)
	newCps(res => {
		t.cis(called ? 10+2+8 : 10+2)(res)
		called = true
	})	
})
test('scan over outputs from 2 callbacks', t => {
	const r = (acc, x) => acc + x
	const cpsFun = (cb1, cb2) => {cb1(2); cb2(3)}
	const newCps = scan(10,11)(r, r)(cpsFun)
	t.plan(2)
	newCps(t.cis(10+2), t.cis(11+3))	
})
test('scan over outputs from 2 callbacks with missing second seed', t => {
	const r = (acc, x) => acc ? acc + x : x
	const cpsFun = (cb1, cb2) => {cb1(2); cb2(3)}
	const newCps = scan(10)(r, r)(cpsFun)
	t.plan(2)
	newCps(t.cis(10+2), t.cis(3))
})
test('scan over outputs from 3 callbacks', t => {
	const r = (acc, x) => acc + x
	const cpsFun = (cb1, cb2, cb3) => {cb1(2); cb2(3); cb3(4)}
	const newCps = scan(10,11,12)(r, r, r)(cpsFun)
	t.plan(3)
	newCps(t.cis(10+2), t.cis(11+3), t.cis(12+4))
})
test('scan with multiple functions applies each to the same seed', t=>{
	const r1=(acc, x) => acc + x, r2=(acc, x) => acc * x
	const cpsFun = (cb1, cb2) => {cb1(2); cb2(3)}
	const cpsFun1 = (cb1, cb2) => {cb2(2); cb1(3)}
	const newCps = scan(10,10)(r1, r2)(cpsFun)
	const newCps1 = scan(10,10)(r1, r2)(cpsFun1)
	t.plan(4)
	newCps(t.cis(10+2),t.cis(10*3))
	newCps1(t.cis(10+3),t.cis(10*2))
})


test('scan with multiple functions and multiple seeds', t=>{
	const r1=(acc, x) => acc + x, r2=(acc, x) => acc * x
	const cpsFun = (cb1, cb2) => {cb1(2); cb2(3)}
	const newCps = scan(10,11)(r1, r2)(cpsFun)
	t.plan(2)
	newCps(t.cis(10+2),t.cis(11*3))
})


test('scanS implies seed=undefined', t => {
	const reducer = (acc=10, x) => acc + x
	const cpsFun = cb => cb(42)
	t.plan(1)
	scanS(reducer)(cpsFun)(t.cis(10+42))
})
test('scanS works with multiple args with seed=undefined implied', t => {
	const r1=(acc=0, x) => acc + x, r2=(acc=1, x) => acc * x
	const cpsFun = (c1,c2) => {c1(10);c2(20)}
	t.plan(2)
	scanS(r1,r2)(cpsFun)(t.cis(0+10), t.cis(1*20))
})

