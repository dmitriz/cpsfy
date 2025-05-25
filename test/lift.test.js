const test = require('./helpers/ava-patched')
const { lift2 } = require('..')

const notCalled = () => {throw Error('I should not be called!')}

test('lift2 over binary function applies to both outputs', t => {
	const F1 = cb => {cb(42)}
	const F2 = cb => {cb(4)}
	const cpsNew = lift2((x,y)=>x-y)(F1,F2)
	cpsNew(t.cis(42-4))
})
