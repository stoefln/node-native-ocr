const path = require('path')
const packageRootPath = path.resolve(__dirname, '..')
const bindings = require('node-gyp-build')(packageRootPath)

const DEFAULT_LANG = 'eng'
const LANG_DELIMITER = '+'

const handleOptions = (options = {}) => {
  if (!options.lang) {
    options.lang = DEFAULT_LANG
  }
  if (!options.tessdataPath) {
    options.tessdataPath = path.resolve(packageRootPath, 'tessdata')
  }
  if (!options.format) {
    options.format = 'txt'
  }

  if (Array.isArray(options.lang)) {
    options.lang = options.lang.join(LANG_DELIMITER)
  }

  return options
}

const makePromise = method => {
  return (arg, options) =>
    new Promise((resolve, reject) => {
      options = handleOptions(options)

      bindings[method](arg, options.lang, options.tessdataPath, options.format !== 'txt', (err, text) => {
        if (err) {
          //console.log('error:', err)
          const error = new Error(err.message || 'Tesserat error occured.')
          error.code = err.code
          reject(error)
        } else {
          //console.log('success:', text)
          resolve(text.trim())
        }
      })
    })
}

exports.recognize = makePromise('recognize')
