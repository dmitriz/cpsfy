// merge extra elements from array2 if it is longer
const mergeArray = (array1, array2) =>
  array1.concat(array2.slice(array1.length))

module.exports = { mergeArray }
