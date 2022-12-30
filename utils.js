const fs = require('node:fs')
const { createInterface } = require('node:readline')

// true if and only if the value is null or undefined
exports.isNil = x => undefined === x || null === x

// merge extra elements from array2 if it is longer	
exports.mergeArray = (array1, array2) =>
  array1.concat(array2.slice(array1.length))

// Inherit prototype
exports.inheritPrototype = (target, source) => {
  Object.setPrototypeOf(
    target, 
    Object.getPrototypeOf(source)
  )
}

/**
 * Send syncronous errors into nth callback of CPS function. 
 * Defaults to n = 2.
 * 
 * @param {Function} cpsF - CPS function
 * @param [{Number} n] - number of the callback
 * @returns {Function} cpsF - CPS function receiving sync errors into its nth callback
 */
exports.err2cb = (cpsF, n=2) => (...cbs) => 
  { try {return cpsF(...cbs)} catch(err) {return cbs[n-1](err)} }



// ---- File/Stream utils ---- //

/**
 * Transform file path into Node stream of the file content
 *  based on `fs.createReadStream`
 *  https://nodejs.org/api/fs.html#fscreatereadstreampath-options
 */
// exports.file2stream = fs.createReadStream

/**
 * Transform Readable Node stream to CPS function with 3 callbacks (onRes, onErr, onEnd):
 *  - onRes receives content of each line from stream;
 *  - onErr receives errors;
 *  - onEnd receives `null` when stream ends.
 * 
 * @param {Stream} input - Readable Node stream
 * @returns {Function} - CPS function
 */
// exports.stream2lines = input => (onRes, onErr, onEnd) => 
    // {try {createInterface(input).on('line', onRes).on('close', _ => onEnd(null))} catch(err) {onErr(err)}}
