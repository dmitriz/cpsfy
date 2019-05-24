// test.js

// Packages
const test = require('ava')

const fn = require('./')

test('t.is works with callbacks', t => {
	const api = (arg, cb) => cb('error', arg + 1)
	api(2, r => t.is(3, r))
})


test('main', t => {

	// const api = (path, cb) => {
	// 	setTimeout(_ => {cb(path)}, 0)
	// }

	const api = (path, cb) => cb(undefined, path)

	const cps = fn(api)

	cps('some')(r => t.is('some', r), x=>x)
})
