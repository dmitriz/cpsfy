const test = require('./config')
const { promiseF2cps } = require('..')

test('promiseF2cps converts fulfilled promise to cps factory returning value in the 1st callback', async t=>{
	await promiseF2cps(x=>Promise.resolve(x))(3)(t.cis(3))
})

test('promiseF2cps converts rejected promise to cps factory returning value in the 2nd callback', async t=>{
	await promiseF2cps(x=>Promise.reject(x))(3)(null,t.cis(3))
})
