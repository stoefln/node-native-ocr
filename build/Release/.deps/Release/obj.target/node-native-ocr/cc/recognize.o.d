cmd_Release/obj.target/node-native-ocr/cc/recognize.o := c++ '-DNODE_GYP_MODULE_NAME=node-native-ocr' '-DUSING_UV_SHARED=1' '-DUSING_V8_SHARED=1' '-DV8_DEPRECATION_WARNINGS=1' '-DV8_DEPRECATION_WARNINGS' '-DV8_IMMINENT_DEPRECATION_WARNINGS' '-D_DARWIN_USE_64_BIT_INODE=1' '-D_LARGEFILE_SOURCE' '-D_FILE_OFFSET_BITS=64' '-DOPENSSL_NO_PINSHARED' '-DOPENSSL_THREADS' '-DBUILDING_NODE_EXTENSION' -I/Users/steph/Library/Caches/node-gyp/12.13.1/include/node -I/Users/steph/Library/Caches/node-gyp/12.13.1/src -I/Users/steph/Library/Caches/node-gyp/12.13.1/deps/openssl/config -I/Users/steph/Library/Caches/node-gyp/12.13.1/deps/openssl/openssl/include -I/Users/steph/Library/Caches/node-gyp/12.13.1/deps/uv/include -I/Users/steph/Library/Caches/node-gyp/12.13.1/deps/zlib -I/Users/steph/Library/Caches/node-gyp/12.13.1/deps/v8/include -I../node_modules/node-addon-api -I/usr/local/Cellar/tesseract/4.1.1/include -I/usr/local/Cellar/leptonica/1.80.0/include/leptonica  -Os -gdwarf-2 -mmacosx-version-min=10.7 -arch x86_64 -Wall -Wendif-labels -W -Wno-unused-parameter -std=gnu++1y -stdlib=libc++ -fno-rtti -fno-strict-aliasing -MMD -MF ./Release/.deps/Release/obj.target/node-native-ocr/cc/recognize.o.d.raw   -c -o Release/obj.target/node-native-ocr/cc/recognize.o ../cc/recognize.cc
Release/obj.target/node-native-ocr/cc/recognize.o: ../cc/recognize.cc \
  ../node_modules/node-addon-api/napi.h \
  /Users/steph/Library/Caches/node-gyp/12.13.1/include/node/node_api.h \
  /Users/steph/Library/Caches/node-gyp/12.13.1/include/node/js_native_api.h \
  /Users/steph/Library/Caches/node-gyp/12.13.1/include/node/js_native_api_types.h \
  /Users/steph/Library/Caches/node-gyp/12.13.1/include/node/node_api_types.h \
  ../node_modules/node-addon-api/napi-inl.h \
  ../node_modules/node-addon-api/napi-inl.deprecated.h \
  /Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv.h \
  /Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv/errno.h \
  /Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv/version.h \
  /Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv/unix.h \
  /Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv/threadpool.h \
  /Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv/darwin.h \
  ../cc/recognize.h ../cc/ocr.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/baseapi.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/apitypes.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/publictypes.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/pageiterator.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/platform.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/resultiterator.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/ltrresultiterator.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/unichar.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/serialis.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/tess_version.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/tesscallback.h \
  /usr/local/Cellar/tesseract/4.1.1/include/tesseract/thresholder.h \
  /usr/local/include/leptonica/allheaders.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/alltypes.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/endianness.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/environ.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/array.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/bbuffer.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/heap.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/list.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/ptra.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/queue.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/rbtree.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/stack.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/arrayaccess.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/bmf.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/ccbord.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/colorfill.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/dewarp.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/gplot.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/imageio.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/jbclass.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/morph.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/pix.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/recog.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/regutils.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/stringcode.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/sudoku.h \
  /usr/local/Cellar/leptonica/1.80.0/include/leptonica/watershed.h
../cc/recognize.cc:
../node_modules/node-addon-api/napi.h:
/Users/steph/Library/Caches/node-gyp/12.13.1/include/node/node_api.h:
/Users/steph/Library/Caches/node-gyp/12.13.1/include/node/js_native_api.h:
/Users/steph/Library/Caches/node-gyp/12.13.1/include/node/js_native_api_types.h:
/Users/steph/Library/Caches/node-gyp/12.13.1/include/node/node_api_types.h:
../node_modules/node-addon-api/napi-inl.h:
../node_modules/node-addon-api/napi-inl.deprecated.h:
/Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv.h:
/Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv/errno.h:
/Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv/version.h:
/Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv/unix.h:
/Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv/threadpool.h:
/Users/steph/Library/Caches/node-gyp/12.13.1/include/node/uv/darwin.h:
../cc/recognize.h:
../cc/ocr.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/baseapi.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/apitypes.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/publictypes.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/pageiterator.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/platform.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/resultiterator.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/ltrresultiterator.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/unichar.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/serialis.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/tess_version.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/tesscallback.h:
/usr/local/Cellar/tesseract/4.1.1/include/tesseract/thresholder.h:
/usr/local/include/leptonica/allheaders.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/alltypes.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/endianness.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/environ.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/array.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/bbuffer.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/heap.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/list.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/ptra.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/queue.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/rbtree.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/stack.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/arrayaccess.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/bmf.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/ccbord.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/colorfill.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/dewarp.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/gplot.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/imageio.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/jbclass.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/morph.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/pix.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/recog.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/regutils.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/stringcode.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/sudoku.h:
/usr/local/Cellar/leptonica/1.80.0/include/leptonica/watershed.h:
