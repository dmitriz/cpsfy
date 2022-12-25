const test = require('./config')
const { cpsSync2arr } = require('..')

test('cpsSync2arr converts syncronous outputs from 1st callback into array', t=>{
	t.deepEqual(cpsSync2arr(cb=>{cb(1,3); cb(2)}), [[1,3],[2]])
	t.deepEqual(cpsSync2arr(cb=>{cb(1,3); cb()}), [[1,3],[]])
})

test('cpsSync2arr ignores asyncronous outputs', t=>{
	t.deepEqual(cpsSync2arr(cb=>{setImmediate(_=>cb(2))}), [])	
	t.deepEqual(cpsSync2arr(cb=>{setImmediate(_=>cb(2)); cb(3)}), [[3]])	
})
