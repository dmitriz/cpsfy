// index.js
'use strict'

module.exports = errbackFn => (...args) => (onResult, onError) =>
	errbackFn(...args, (err, ...rest) => err ? onResult(...rest) : onError(err))
