{
  'targets': [
    {
      'target_name': 'node-native-ocr',
      'sources': [
        'cc/node-native-ocr.cc',
        'cc/ocr.cc',
        'cc/recognize.cc'
      ],
      'include_dirs': [
        'tesseract/build/bin/include',
        'leptonica/build/bin/include',
        '<!(node -p "require(\'node-addon-api\').include_dir")'
      ],
      'conditions': [
        [ "OS!='win'", {
          'library_dirs': [
            '../tesseract/build/bin/lib',
            '../leptonica/build/bin/lib',
            '../libjpeg/build/bin/lib',
            '../libpng/build/bin/lib',
            '../libtiff/build/bin/lib'
          ],
          'libraries': [
            '../tesseract/build/bin/lib/libtesseract.a',
            '../leptonica/build/bin/lib/libleptonica.a',
            '../libjpeg/build/bin/lib/libjpeg.a',
            '../libpng/build/bin/lib/libpng16.a',
            '../libtiff/build/bin/lib/libtiff.a'
          ]
        }],
        [ "OS=='win'", {
          'library_dirs': [
            '../tesseract/build/bin/lib',
            '../leptonica/build/bin/lib',
            '../libjpeg/build/bin/lib',
            '../libpng/build/bin/lib',
            '../libtiff/build/bin/lib'
          ],
          'libraries': [
            '../tesseract/build/bin/lib/tesseract41.lib',
            '../leptonica/build/bin/lib/leptonica-1.80.0.lib',
            '../libjpeg/build/bin/lib/jpeg.lib',
            '../libpng/build/bin/lib/libpng16.lib',
            '../libtiff/build/bin/lib/tiff.lib'
          ]
        }]
      ],
      'dependencies': [],
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': { 
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.9'
      },
      'msvs_settings': {
        'VCCLCompilerTool': { 
          'ExceptionHandling': 1 
        }
      }
    }
  ]
}
