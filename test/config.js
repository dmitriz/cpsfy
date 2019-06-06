const test = process.env.TEST || 'tape'

const getTestPatch = ({
	'tape': _ => require('./helpers/tape-patched'),
	'ava': _ => require('./helpers/ava-patched'),
})[test]

module.exports = getTestPatch()
