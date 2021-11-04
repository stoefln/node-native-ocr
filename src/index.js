const path = require('path')
let bindings

const isElectron = process.versions.hasOwnProperty('electron')
const ocrPackagePath = 'node_modules/node-native-ocr'

if (isElectron) {
  const electron = require("electron")
  const appPath = (electron.remote?.app || electron.app).getAppPath()
  const modulePath = path.resolve(appPath, ocrPackagePath, 'build/Release/node-native-ocr')
  bindings = __non_webpack_require__(modulePath)
} else {
  bindings = require('../build/Release/node-native-ocr.node')
}


const DEFAULT_LANG = 'eng'
const LANG_DELIMITER = '+'

const handleOptions = (options = {}) => {

  if(!options.lang){
    options.lang = DEFAULT_LANG
  }
  if(!options.tessdataPath){
    if (isElectron) {
      console.log('Electron mode.')
      const electron = require("electron")
      const appPath = (electron.remote?.app || electron.app).getAppPath()
      options.tessdataPath = path.resolve(appPath, ocrPackagePath, 'tessdata')
    } else{
      console.log('Node mode.')
      options.tessdataPath = path.resolve(__dirname, "..", "tessdata")
    }
  }
  console.log('options.tessdataPath: ', options.tessdataPath)

  if (Array.isArray(options.lang)) {
    options.lang = options.lang.join(LANG_DELIMITER)
  }

  return options
}


const makePromise = (method) => {

  return (arg, options) => new Promise((resolve, reject) => {
    options = handleOptions(options)
    
    bindings[method](arg, options.lang, options.tessdataPath, (err, text) => {
      if (err) {
        console.log('error:', err)
        const error = new Error(text)
        error.code = err
        return reject(error)
      } else {
        console.log('success:', text)
      }

      resolve(text.trim())
    })
  })
}

exports.recognize = makePromise('recognize')
