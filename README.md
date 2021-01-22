[![Build Status](https://travis-ci.org/stoefln/node-node-native-ocr.svg?branch=master)](https://travis-ci.org/stoefln/node-node-native-ocr)
[![Coverage](https://codecov.io/gh/stoefln/node-node-native-ocr/branch/master/graph/badge.svg)](https://codecov.io/gh/stoefln/node-node-native-ocr)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/stoefln/node-node-native-ocr?branch=master&svg=true)](https://ci.appveyor.com/project/stoefln/node-node-native-ocr)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/node-node-native-ocr.svg)](http://badge.fury.io/js/node-node-native-ocr)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/node-node-native-ocr.svg)](https://www.npmjs.org/package/node-node-native-ocr)
-->


# node-native-ocr

<img align="right" alt="" src="https://raw.githubusercontent.com/stoefln/node-node-native-ocr/master/node-native-ocr.gif" />

The native Node.js bindings to the [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) project.

- Using Node.js bindings, avoid spawning `tesseract` command line.  
- Asynchronous I/O: Image reading and processing in insulated event loop backed by [libuv](https://github.com/libuv/libuv).
- Support to read image data from JavaScript `buffer`s.

Contributions are welcome.

## Install

First of all, a g++ 4.9 compiler is required.

Before install `node-native-ocr`, the following dependencies should be installed

```sh
$ brew install pkg-config tesseract # mac os
```

Then npm install

```sh
$ npm install node-native-ocr
```

### To Use with Electron

Due to the limitation of node native modules, if you want to use `node-native-ocr` with electron, add a `.npmrc` file to the root of your electron project, before `npm install`:

```ini
runtime = electron
; The version of the local electron,
; use `npm ls electron` to figure it out
target = 1.7.5
target_arch = x64
disturl = https://atom.io/download/atom-shell
```

<!--

### The N-API version of `node-native-ocr`

The N-API version of `node-native-ocr` (node-native-ocr@n-api) is and will be remaining experimental before the feature of N-API stabilized in Node.js 8.0 and ported to older Node.js LTS lines ([via](https://medium.com/the-node-js-collection/n-api-next-generation-node-js-apis-for-native-modules-169af5235b06)).

For now, it is recommended to use `node-native-ocr@latest`

-->

## Usage

### Recognize an Image Buffer

```js
import {
  recognize
} from 'node-native-ocr'

import fs from 'fs-extra'

const filepath = path.join(__dirname, 'test', 'fixtures', 'node-native-ocr.jpg')

fs.readFile(filepath).then(recognize).then(console.log) // 'node-native-ocr'
```


## recognize(image [, options])

- **image** `Buffer` the content buffer of the image file.
- **options** `node-native-ocrOptions=` optional

Returns `Promise.<String>` the recognized text if succeeded.

### `node-native-ocrOptions` `Object`


```js
{
  // @type `(String|Array.<String>)=eng`,
  //
  // Specifies language(s) used for OCR.
  //   Run `tesseract --list-langs` in command line for all supported languages.
  //   Defaults to `'eng'`.
  //
  // To specify multiple languages, use an array.
  //   English and Simplified Chinese, for example:
  // ```
  // lang: ['eng', 'chi_sim']
  // ```
  lang: 'eng'
}
```

## `Promise.reject(error)`

- **error** `Error` The JavaScript `Error` instance
  - **code** `String` Error code.
  - **message** `String` Error message.
  - other properties of `Error`.

### code: `ERR_READ_IMAGE`

Rejects if it fails to read image data from file or buffer.

### code: `ERR_INIT_TESSER`

Rejects if tesseract fails to initialize

## Example of Using with Electron

```js
// For details of `mainWindow: BrowserWindow`, see
// https://github.com/electron/electron/blob/master/docs/api/browser-window.md
mainWindow.capturePage({
  x: 10,
  y: 10,
  width: 100,
  height: 10

}, (data) => {
  recognize(data.toPNG()).then(console.log)
})
```

## Compiling Troubles

For Mac OS users, if you are experiencing trouble when compiling, run the following command:

```sh
$ xcode-select --install
```

will resolve most problems.

Warnings:

```
xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance
```

resolver:

```sh
$ sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

## License

MIT
