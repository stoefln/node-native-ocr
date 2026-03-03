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
  const inputFileName = `${tempFileName}.jpg`
  const outputFileBase = `${tempFileName}-ocr`
  const inputPath = path.join(tempDir, inputFileName)
  const outputBasePath = path.join(tempDir, outputFileBase)
  const executable = fs.existsSync(DEFAULT_TESSERACT_BINARY) ? DEFAULT_TESSERACT_BINARY : 'tesseract'

  fs.writeFileSync(inputPath, buffer)

  const args = [inputFileName, outputFileBase, '-l', options.lang]
  if (options.format === 'tsv') {
    args.push('tsv')
  }

  execFile(
    executable,
    args,
    {
      cwd: tempDir,
      env: {
        ...process.env,
        TESSDATA_PREFIX: options.tessdataPath
      },
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024
    },
    (error, stdout, stderr) => {
    const outputExtension = options.format === 'tsv' ? 'tsv' : 'txt'
    const outputPath = `${outputBasePath}.${outputExtension}`

    if (error) {
      if (fs.existsSync(outputPath)) {
        try {
          const outputText = fs.readFileSync(outputPath, 'utf8')
          fs.rmSync(tempDir, {recursive: true, force: true})
          callback(null, outputText)
          return
        } catch (readError) {
          const readMessage = readError && readError.message ? readError.message : 'Failed to read tesseract output.'
          const outputReadError = new Error(readMessage)
          outputReadError.code = 'ERR_INIT_TESSER'
          fs.rmSync(tempDir, {recursive: true, force: true})
          callback(outputReadError)
          return
        }
      }

      const message = [stderr, stdout, error.message].filter(Boolean).join('\n').trim()
      const commandError = new Error(message || 'Tesserat error occured.')
      commandError.code = 'ERR_INIT_TESSER'
      fs.rmSync(tempDir, {recursive: true, force: true})
      callback(commandError)
      return
    }

    try {
      const outputText = fs.readFileSync(outputPath, 'utf8')
      fs.rmSync(tempDir, {recursive: true, force: true})
      callback(null, outputText)
    } catch (readError) {
      const message = readError && readError.message ? readError.message : 'Failed to read tesseract output.'
      const outputError = new Error(message)
      outputError.code = 'ERR_INIT_TESSER'
      fs.rmSync(tempDir, {recursive: true, force: true})
      callback(outputError)
    }
    }
  )
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
