const test = require('./config')
const { mapSpread } = require('..')

test('mapSpread transforms output 1-tuples to m-tuples', t => {
	const cpsFun = cb => cb(42)
	mapSpread(x => [])(cpsFun)(t.cis())
	mapSpread(x => [x*2])(cpsFun)(t.cis(84))
	mapSpread(x => [x,x*2])(cpsFun)(t.cis(42,84))
	mapSpread(x => [x,x*2,5])(cpsFun)(t.cis(42,84,5))
})

test('mapSpread transforms output 2-tuples to m-tuples', t => {
	const cpsFun = cb => cb(42, 24)
	mapSpread((a,b)=>[])(cpsFun)(t.cis())	
	mapSpread((a,b)=>[a-b])(cpsFun)(t.cis(18))	
	mapSpread((a,b)=>[a,a-b,b,1])(cpsFun)(t.cis(42,18,24,1))	
})

test('mapSpread over single function with no arguments', t => {
	const cpsFun = cb => cb()
	mapSpread(() => [])(cpsFun)(t.cis())	
	mapSpread(() => [30])(cpsFun)(t.cis(30))	
})

test('mapSpread preserves outputs for missing transforms', t => {
	const cpsFun = (cb1, cb2) => {cb1(42); cb2(23)}
	mapSpread(x => [x*2,1,4])(cpsFun)(_ => null, t.cis(23))	
})

test('mapSpread over multiple functions', t => {
	t.plan(4)
	const cpsFun = (cb1, cb2) => {cb1(42); cb2(23)}
	mapSpread(x => [x/2], x => [x*2])(cpsFun)(t.cis(21), t.cis(46))	
	mapSpread(x => [x/2,x], x => [x*2,-x])(cpsFun)(t.cis(21,42), t.cis(46,-23))	
})

test('mapSpread over more functions than callbacks, the extra functions are ignored', t => {
	const cpsFun = cb => cb(42)
	mapSpread(x => [x*2], x => [x+10])(cpsFun)(t.cis(84))	
})

test('mapSpread transforms tuples via arrays', t => {
	const F = cb => cb(1,2)
	mapSpread((...arr) => arr.map(a => a + 1))(F)(t.cDeepEqual(2,3))
})
