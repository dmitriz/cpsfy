const test = require('./config')
const { node2cps } = require('..')

const node_ex = (x,f) => {f(null,x+1)}
test('node2cps converts node api function with callback to cps function', t => {
	node2cps(node_ex)(1)(t.cis(2))
})
test('node2cps works with CPS methods', t=>{
	node2cps(node_ex)(1).map(x=>x*2)(t.cis(4))
})

test('node2cps works with several args', t => {
	const node_ex = (a,b,f) => {f(null,a+b)}
	node2cps(node_ex)(1,2)(t.cis(3))
})
test('node2cps works with no args', t => {
	const node_ex = (f) => {f(null,11)}
	node2cps(node_ex)()(t.cis(11))
})


test('node2cps passes error into the 2nd callback', t=>{
	const node_err = (x,f) => {f('Error!')}		
	node2cps(node_err)(1)(null,t.cis('Error!'))
})
