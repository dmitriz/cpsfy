const test = process.env.TEST || 'tape'
module.exports = require(`./helpers/${test}-patched`)
