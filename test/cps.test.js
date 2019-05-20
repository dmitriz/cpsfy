const test = require('./config').test
const { CPS } = require('..')

test('provide map method on CPS functions', t => {
	const cpsFun = cb => cb(42)
	CPS(cpsFun).map(y => y + 1)
		(t.cis(43))
})

test('provide chain method on CPS functions', t => {
	const cpsFun = cb => cb(42)
	CPS(cpsFun).chain(y => cb => cb(y + 1))
		(t.cis(43))
})

test('does not mutate object', t => {
	let obj = {}
	CPS(obj)
	t.deepEqual(obj, {})
})
