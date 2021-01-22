{
  'targets': [
    {
      'target_name': 'node-native-ocr',
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': { 'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7',
      },
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      },
      'sources': [
        'cc/node-native-ocr.cc',
        'cc/ocr.cc',
        'cc/recognize.cc'
      ],
      'include_dirs': [
        '<!(node -p "require(\'node-addon-api\').include_dir")',

        '<!@(pkg-config tesseract --cflags-only-I | sed s/-I//g)',
      ],
      'libraries': [
        '<!@(pkg-config tesseract --libs)'
      ],
      'dependencies': [],
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': {
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7'
      },
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      }
    }
  ]
}
