#include <napi.h>
#include <uv.h>
#include <stdint.h>
#include "recognize.h"


using Napi::String;

Napi::Object Init(Napi::Env env, Napi::Object exports) {

    exports.Set(
        Napi::String::New(env, "recognize"), 
        Napi::Function::New(env, Recognize));

    return exports;
}


NODE_API_MODULE(NODE_NATIVE_OCR, Init);
