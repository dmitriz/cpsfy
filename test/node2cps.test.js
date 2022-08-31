const test = require('./config')
const { node2cps } = require('..')
const { pipeline, Duplex } = require('stream')

const cps2promise = cpsFn => new Promise((res, rej)=> cpsFn(res, rej))

test('node2cps converts the stream pipeline node function to cps function', async t => {
	const cpsFn = node2cps(pipeline)(Duplex.from([]), Duplex.from([]))
	t.is(await cps2promise(cpsFn), undefined)
})
