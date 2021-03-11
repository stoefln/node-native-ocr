const path = require('path')
let bindings

const isElectron = process.versions.hasOwnProperty('electron')

if(isElectron) {

  const appPath = require("electron").remote.app.getAppPath()
  const ocrPackagePath = 'node_modules/node-native-ocr'
  const modulePath = path.resolve(appPath, ocrPackagePath, 'build/Release/node-native-ocr')
  console.log('modulePath', modulePath)
  const tessdataPath = path.resolve(ocrPackagePath, "tessdata")
  process.env.TESSDATA_PREFIX = tessdataPath
  console.log('tessdataPath', tessdataPath)
  bindings = __non_webpack_require__(modulePath)
  
} else {

  const tessdataPath = path.resolve(__dirname,"..","tessdata")
  process.env.TESSDATA_PREFIX = tessdataPath
  bindings = require('../build/Release/node-native-ocr.node')
}


const DEFAULT_LANG = 'eng'
const LANG_DELIMITER = '+'

const handleOptions = ({
  lang = DEFAULT_LANG
} = {}) => {

  if (Array.isArray(lang)) {
    lang = lang.join(LANG_DELIMITER)
  }

  return {
    lang
  }
}


const makePromise = (method) => {
  
  return (arg, options) => new Promise((resolve, reject) => {
    options = handleOptions(options)
    
    bindings[method](arg, options.lang, (err, text) => {
      if (err) {
        console.log('errrror:', err)
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
