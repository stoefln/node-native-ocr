const path = require('path')
const fs = require('fs')
const os = require('os')
const crypto = require('crypto')
const {execFile} = require('child_process')
const packageRootPath = path.resolve(__dirname, '..')
const isWindows = process.platform === 'win32'
const bindings = isWindows ? null : require('node-gyp-build')(packageRootPath)

const DEFAULT_LANG = 'eng'
const LANG_DELIMITER = '+'
const DEFAULT_TESSERACT_BINARY = path.resolve(
  packageRootPath,
  'tesseract',
  'build',
  'bin',
  'bin',
  process.platform === 'win32' ? 'tesseract.exe' : 'tesseract'
)

/**
 * @typedef {Object} RecognizeOptions
 * @property {string|string[]} [lang]
 * @property {string} [tessdataPath]
 * @property {'txt'|'tsv'} [format]
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

  if (Array.isArray(options.lang)) {
    options.lang = options.lang.join(LANG_DELIMITER)
  }

  return options
}

const runTesseractCli = (buffer, options, callback) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'node-native-ocr-'))
  const tempFileName = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
  const inputPath = path.join(tempDir, `${tempFileName}.img`)
  const executable = fs.existsSync(DEFAULT_TESSERACT_BINARY) ? DEFAULT_TESSERACT_BINARY : 'tesseract'

  fs.writeFileSync(inputPath, buffer)

  const args = [inputPath, 'stdout', '-l', options.lang, '--tessdata-dir', options.tessdataPath]
  if (options.format === 'tsv') {
    args.push('tsv')
  }

  execFile(executable, args, {windowsHide: true, maxBuffer: 10 * 1024 * 1024}, (error, stdout, stderr) => {
    fs.rmSync(tempDir, {recursive: true, force: true})

    if (error) {
      const commandError = new Error((stderr || error.message || 'Tesserat error occured.').trim())
      commandError.code = 'ERR_INIT_TESSER'
      callback(commandError)
      return
    }

    callback(null, stdout)
  })
}

const makePromise = method => {
  return (arg, options) =>
    new Promise((resolve, reject) => {
      if (!Buffer.isBuffer(arg)) {
        reject(new TypeError('1. param needs to be a Buffer!'))
        return
      }

      options = handleOptions(options)

      const invoke = isWindows
        ? callback => runTesseractCli(arg, options, callback)
        : callback => bindings[method](arg, options.lang, options.tessdataPath, options.format !== 'txt', callback)

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
