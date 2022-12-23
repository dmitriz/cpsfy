// true if and only if the value is null or undefined
exports.isNil = x => undefined == x || null == x

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
