#!/usr/bin/env node

const path = require('path')

if (process.platform === 'win32') {
  console.log('node-native-ocr: skipping native install on Windows')
  process.exit(0)
}

const packageRootPath = path.resolve(__dirname, '..')
require('node-gyp-build')(packageRootPath)
