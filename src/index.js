const path = require('path')
const packageRootPath = path.resolve(__dirname, '..')
const BACKEND_NATIVE = 'native'

const DEFAULT_LANG = 'eng'
const LANG_DELIMITER = '+'

let nativeBindings = null

const getBackendName = () => {
  return BACKEND_NATIVE
}

const loadNativeBindings = () => {
  if (nativeBindings) {
    return nativeBindings
  }

  try {
    nativeBindings = require('node-gyp-build')(packageRootPath)
    return nativeBindings
  } catch (error) {
    const bindingsError = new Error(`Failed to load native bindings from ${packageRootPath}: ${error.message}`)
    bindingsError.code = 'ERR_LOAD_NATIVE_BINDINGS'
    throw bindingsError
  }
}

/**
 * @typedef {Object} RecognizeOptions
 * @property {string|string[]} [lang]
 * @property {string} [tessdataPath]
 * @property {'txt'|'tsv'} [format]
 * @property {number} [psm]
 * @property {boolean} [requireNonEmpty]
 */

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
  if (typeof options.requireNonEmpty !== 'boolean') {
    options.requireNonEmpty = false
  }

  if (Array.isArray(options.lang)) {
    options.lang = options.lang.join(LANG_DELIMITER)
  }

  return options
}

const makePromise = method => {
  return (arg, options) =>
    new Promise((resolve, reject) => {
      if (!Buffer.isBuffer(arg)) {
        reject(new TypeError('1. param needs to be a Buffer!'))
        return
      }

      options = handleOptions(options)

      const invoke = callback => loadNativeBindings()[method](arg, options.lang, options.tessdataPath, options.format !== 'txt', callback)

      invoke((err, text) => {
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
exports.__internal = {
  getBackendName
}
