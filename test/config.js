const test = process.env.TEST || 'tape'

const test_patch = ({
	'tape': require('./helpers/tape-patched'),
	'ava': require('./helpers/ava-patched'),
})[test] 

module.exports = test_patch
