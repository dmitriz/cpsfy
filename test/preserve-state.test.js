const test = require('./config').test
const { map, chain } = require('..')


// --- Preserving state

const checkState = (name, cpsFn, cpsFn1) => {
	test(name + 'enum props passed to transformed CPS fn', t => {
		t.deepEqual([cpsFn1.p, cpsFn1.f], [12, f])
	})
	test(name + 'prototype passed to transformed CPS fn', t => {
		t.is(cpsFn1.a, 22)
	})
}

const cpsFn = cb => cb(42)
const f = x => x - 4
const protoObj = {a: 22}
Object.setPrototypeOf(cpsFn, protoObj)
cpsFn.p = 12
cpsFn.f = f

const cpsFn1 = map(x => x*2)(cpsFn)
const cpsFn2 = chain(x => cb => x*2)(cpsFn)

checkState('map: ', cpsFn, cpsFn1)
checkState('chain: ', cpsFn, cpsFn2)
