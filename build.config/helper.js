const path = require('path')

let hasOutput = false
let cachedConfig
function config() {
  if (cachedConfig) {
    return cachedConfig
  }

  const p = process.env.PACKAGE_NAME
  const entry = require(`../build.config/package.${p}.js`)

  if (!hasOutput) {
    hasOutput = true
    // console.log('webpack entry ', entry)
    // console.log('env', process.env)
  }

  cachedConfig = entry
  return entry
}

function getPageEntry() {
  return config().entry
}

function isObject(someObject) {
  return Object.prototype.toString.call(someObject) === '[object Object]'
}

function getEntrypoint() {
  const entry = config().entry
  if (!isObject(entry)) {
    return entry
  }

  return Object.entries(entry).reduce((a, [entry, value]) => {
    a[entry] = (isObject(value) && value.entry) || value
    return a
  }, {})
}

module.exports = {
  config,
  getPageEntry,
  isObject,
  getEntrypoint,
}
