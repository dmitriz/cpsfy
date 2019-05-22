const test = require('./config').test
const { scan, pipeline } = require('..')

// const cpsFun = cb => {cb(42); cb(24)}

test('scan over single callback output', t => {
	const reducer = (acc, x) => acc + x
	const initState = 10
	const cpsFun = cb => cb(42)
	scan(reducer)(initState)(cpsFun)(t.cis(52))
})

// test('scan over single repeated callback output', t => {
// 	const reducer = (acc, x) => acc + x
// 	const initState = 10
// 	const cpsFun = cb => { cb(42); cb(28) }
// 	scan(reducer)(initState)(cpsFun)(t.cis(80))
// })

