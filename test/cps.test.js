const test = require('./config').test
const { CPS } = require('..')

const cpsFun = cb => cb(42)
const cpsWrapped = CPS(cpsFun)


test('does not mutate source', t => {
	let obj = {}
	CPS(obj)
	t.deepEqual(obj, {})
})

test('map method works correctly', t => {
	const cpsNew = cpsWrapped.map(y => y + 1)
	cpsNew(t.cis(43))
})

test('map is provided on target as well', t => {
	cpsWrapped.map(z => z + 2).map(z => z - 1)(t.cis(43))
})

test('provide chain method on CPS functions', t => {
	CPS(cpsFun).chain(y => cb => cb(y + 1))(t.cis(43))
})
test('chain is provided on target as well', t => {
	cpsWrapped
		.chain(z => cb => cb(z + 2))
		.chain(z => cb => cb(z - 1))(t.cis(43))
})

test('function on CPS(fn) is delegated to fn', t => {
	const cpsFun = cb => cb(42)
	t.is(
		CPS(cpsFun)(x => x + 1),
		43
	)
})
