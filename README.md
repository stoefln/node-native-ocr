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

The native Node.js bindings to the [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) project using N-API and [node-addon-api](https://github.com/nodejs/node-addon-api).

Benefits:

- Avoid spawning `tesseract` command line.
- Asynchronous I/O: Image reading and processing in insulated event loop backed by [libuv](https://github.com/libuv/libuv).
- Support to read image data from JavaScript `buffer`s.

Contributions are welcome.

## Install

Via npm:

```sh
$ npm install node-native-ocr
```

## Usage

### Recognize an Image Buffer

```js
import { recognize } from "node-native-ocr";

import fs from "fs-extra";

const filepath = path.join(
  __dirname,
  "test",
  "fixtures",
  "node-native-ocr.jpg"
);

fs.readFile(filepath).then(recognize).then(console.log); // 'node-native-ocr'
```

## recognize(image [, options])

- **image** `Buffer` the content buffer of the image file.
- **options** `node-native-ocrOptions=` optional

Returns `Promise.<String>` the recognized text if succeeded.

### `node-native-ocrOptions` `Object`

````js
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
  lang: "eng";
}
````

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
mainWindow.capturePage(
  {
    x: 10,
    y: 10,
    width: 100,
    height: 10,
  },
  (data) => {
    const appPath = (electron.app || electron.remote.app).getAppPath();
    const tessdataPath = path.resolve(appPath, ocrPackagePath, "tessdata");
    recognize(data.toPNG(), {
      lang: ["eng", "ita"],
      // output can be 'tsv' or 'txt'
      output: "txt",
      tessdataPath,
    }).then(console.log);
  }
);
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

## Why another node OCR package?

After doing a lot of research and trying to compile other node OCR packages for electron without success, I decided to create my own. Based on N-API, which would save me from a lot of trouble.
Now it is used in [Repeato](https://www.repeato.app), a low-code mobile app testing tool which works based on Computer Visions.
Node-native-ocr enables Repeato to do text recognition and text assertions on Android and iOS and acrross all platforms such as React Native, Flutter or Unity.

Let me know about your projects too, and I can add them here to the list!


## TSV format description

If you set the output option to 'tsv', you will get a table of data, cells separated by tabs.
Since I had a hard time finding the format for it, I will paste it here:
This is the original reference: https://www.tomrochette.com/tesseract-tsv-format

### There are 12 columns in the table:
1. **level**: hierarchical layout (a word is in a line, which is in a paragraph, which is in a block, which is in a page), a value from 1 to 5
   * 1: page
   * 2: block
   * 3: paragraph
   * 4: line
   * 5: word
2. **page_num**: when provided with a list of images, indicates the number of the file, when provided with a multi-pages document, indicates the page number, starting from 1
3. **block_num**: block number within the page, starting from 0
4. **par_num**: paragraph number within the block, starting from 0
5. **line_num**: line number within the paragraph, starting from 0
6. **word_num**: word number within the line, starting from 0
7. **left**: x coordinate in pixels of the text bounding box top left corner, starting from the left of the image
8. **top**: y coordinate in pixels of the text bounding box top left corner, starting from the top of the image
9. **width**: width of the text bounding box in pixels
10. **height**: height of the text bounding box in pixels
11. **conf**: confidence value, from 0 (no confidence) to 100 (maximum confidence), -1 for all level except 5
12. **text**: detected text, empty for all levels except 5

## Development notes

To build the node-native-ocr project for testing, navigate into the node-native-ocr directory and exec
`npm run install`

I had problems with some node versions. A version which definitelly worked for me was v16.13.0.
After changing the code, and rebuilding the project, just run `npm run test`

To test changes, compilation is needed before. prebuild will only recompile if there is no precompiled version for your platform in the "prebuilds" dir. That's we have to delete it before starting the compilation. You can use `npm run rebuild-and-test` for that

## License

MIT
