#
# node-native-ocr
#

cmake_minimum_required(VERSION 3.7)
project(node-native-ocr)

set(CMAKE_CXX_STANDARD 11)

set(SOURCE_FILES
        cc/ocr.cc
        cc/ocr.h
        cc/node-native-ocr.cc
        cc/recognize.cc
        cc/recognize.h)

#add_executable(napi_node-native-ocr ${SOURCE_FILES})