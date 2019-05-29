const test = require('./config')
const { map, chain } = require('..')


// --- Preserving state

const checkState = (name, cpsFn, cpsFn1) => {
	test(name + 'prototype passed to transformed CPS fn', t => {
		t.is(cpsFn1.a, 22)
	})
}

const cpsFn = cb => cb(42)
const protoObj = {a: 22}
Object.setPrototypeOf(cpsFn, protoObj)

const cpsFn1 = map(x => x*2)(cpsFn)
const cpsFn2 = chain(x => cb => cb(x*2))(cpsFn)

checkState('map: ', cpsFn, cpsFn1)
checkState('chain: ', cpsFn, cpsFn2)
