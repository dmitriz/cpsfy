const test = require('./config').test
const { filter } = require('..')

test('filter single output', t => {
	const cpsFun = cb => cb(42) + cb(33)
	t.plan(1)
	filter(n => n > 35)(cpsFun)(t.cis(42))
})

test('filter multiple occurences', t => {
	const cpsFun = cb => cb(33) + cb(42) + cb(33)
	t.plan(2)
	filter(n => n < 35)(cpsFun)(t.cis(33))
})

test('filter tuples', t => {
	const cpsFun = cb => cb(1,2) + cb(3,4)
	t.plan(1)
	const cpsNew = filter((a,b) => a > 1)(cpsFun)
	cpsNew(t.cis(3))
})

test('filter multiple outputs', t => {
	const cpsFun = (c1, c2) => 
		c1(1) + c1(2) + 
		c2(1) + c2(2)
	t.plan(2)
	filter(
		n => n < 2,
		n => n > 1 
	)(cpsFun)
	(t.cis(2), t.cis(2))
})
