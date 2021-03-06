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
          'libraries': [
            '../tesseract/build/bin/lib/libtesseract.a',
            '../leptonica/build/bin/lib/libleptonica.a',
            '../libjpeg/build/bin/lib/libjpeg.a'
          ]
        }],
        [ "OS=='win'", {
          'libraries': [
            '../tesseract/build/bin/lib/tesseract41.lib',
            '../leptonica/build/bin/lib/leptonica-1.80.0.lib',
            '../libjpeg/build/bin/lib/libjpeg.lib'
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
