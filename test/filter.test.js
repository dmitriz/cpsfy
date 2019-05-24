const test = require('./config').test
const { filter } = require('..')

test('filter single output', t => {
	const cpsFun = cb => cb(42) + cb(33)
	t.plan(1)
	filter(n => n > 35)(cpsFun)(t.cis(42))
})

test('filter out all outputs', t => {
	const cpsFun = cb => cb(42) + cb(33)
	t.plan(0)
	// won't call the callback
	filter(n => n > 45)(cpsFun)()
})

test('filter multiple occurences', t => {
	const cpsFun = cb => cb(33) + cb(42) + cb(33)
	t.plan(2)
	filter(n => n < 35)(cpsFun)(t.cis(33))
})

test('filter tuples', t => {
	const cpsFun = cb => cb(1,2) + cb(3,4)
	t.plan(1)
	const cpsNew = filter(a => a > 1)(cpsFun)
	cpsNew(t.cis(3))
})

test('filter multiple outputs', t => {
	const cpsFun = (c1, c2) => 
		c1(1) + c1(2) +
		c2(3) + c2(4)
	const cpsNew = filter(
		// filters 1st output [1,2]
		n => n < 2,
		// filters 2nd output [3,4]
		n => n < 1 
	)(cpsFun)
	t.plan(1)
	cpsNew(t.cis(1))
})

test('filter 3 outputs', t => {
	const cpsFun = (c1, c2) => 
		c1(2) + c2(5)
	const cpsNew = filter(
		// filters 1st output [1,2]
		n => n < 4,
		// filters 2nd output [3,4]
		n => n < 6
	)(cpsFun)
	t.plan(2)
	cpsNew(t.cis(2), t.cis(5))
})



