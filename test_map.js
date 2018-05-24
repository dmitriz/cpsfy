const test = require('ava')
const {map} = require('.')

test('map over single function', t => {
	const cpsFun = cb => cb(42)
	const mappedCpsFun = map(x => x * 2)(cpsFun)
	mappedCpsFun(res => t.is(res, 84))
})

test('map over single function with several arguments', t => {
	const cpsFun = cb => cb(42, 24)
	const mappedCpsFun = map((a, b) => a - b)(cpsFun)
	mappedCpsFun(res => t.is(res, 18))	
})

test('map over single function with no arguments', t => {
	const cpsFun = cb => cb()
	const mappedCpsFun = map(() => 30)(cpsFun)
	mappedCpsFun(res => t.is(res, 30))	
})

test('further callbacks are unaffected when map over single function', t => {
	const cpsFun = (cb1, cb2) => {cb1(42); cb2(23)}
	const mappedCpsFun = map(x => x*2)(cpsFun)
	mappedCpsFun(x=>x, res => t.is(res, 23))	
})

test('map over multiple functions', t => {
	const cpsFun = (cb1, cb2) => {cb1(42); cb2(23)}
	const mappedCpsFun = map(x => x/2, x => x*2)(cpsFun)
	mappedCpsFun(res => t.is(res, 21), res => t.is(res, 46))	
})

test('map over more functions than callbacks, the extra functions are ignored', t => {
	const cpsFun = cb => cb(42)
	const mappedCpsFun = map(x => x*2, x => x+10)(cpsFun)
	mappedCpsFun(res => t.is(res, 84))	
})
