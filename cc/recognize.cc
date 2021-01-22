#include <napi.h>
#include <uv.h>
#include <stdint.h>
#include "recognize.h"
#include "ocr.h"

using Napi::Env;
using Napi::HandleScope;
using Napi::String;
using Napi::Function;

class RecognizeWorker : public Napi::AsyncWorker
{

private:
  uint8_t *_buffer;
  size_t _length;
  std::string _lang;
  char *_outText;

  Pix *ReadImage()
  {
    return pixReadMem(_buffer, _length);
  }

public:
  RecognizeWorker(uint8_t *buffer,
                  size_t length,
                  std::string &lang,
                  Function &callback)
      : Napi::AsyncWorker(callback), _buffer(buffer), _length(length), _lang(lang)  {

      }

  ~RecognizeWorker() {}

  void OnOK () override {
    HandleScope scope(Env());
    Callback().Call({Env().Null(), String::New(Env(), _outText)});
  }

  void Execute() override
  {
    printf("Execute()\n");
    Pix *image = ReadImage();

    if (image == nullptr)
    {
      SetError("ERR_READ_IMAGE");
      return;
    }
    printf("execute with lang: %s\n", _lang.c_str());
    char *error_code = nullptr;
    char *error_message = nullptr;
    int tess_failed = TessRecognizePix(image, _lang.c_str(),
                                       _outText, nullptr,
                                       error_code, error_message);
    
    if (tess_failed)
    {
      //printf("E2\n");
      //SetError(error_code, error_message);
      std::string msg("Tesseract Error: ");
      msg += error_message;
      SetError(msg);
      return;
    }
  }
};

// Ref:
// https://github.com/nodejs/node/blob/master/src/node_api.cc#L2911
void _getBufferInfo(Napi::Object buffer, void **data, size_t *length)
{
  if (data != nullptr)
  {
    *data = buffer.As<Napi::Buffer<char>>().Data();
  }

  if (length != nullptr)
  {
    *length = buffer.As<Napi::Buffer<char>>().Length();
  }
}

void Recognize(const Napi::CallbackInfo &info)
{

  Napi::Env env = info.Env();

  if (info.Length() < 3)
  {
    Napi::TypeError::New(env, "Invalid argument count").ThrowAsJavaScriptException();
    return;
  }

  if (!info[1].IsString())
  {
    Napi::TypeError::New(env, "Second param needs to be a string!").ThrowAsJavaScriptException();
    return;
  }

  if (!info[2].IsFunction())
  {
    Napi::TypeError::New(env, "Third argument needs to be a callback!").ThrowAsJavaScriptException();
    return;
  }
  size_t bufferLength;
  uint8_t *bufferData;
  std::string lang = info[1].As<String>().Utf8Value();
  Function callback = info[2].As<Function>();
  
  printf("\n\nlang: %s\n", lang.c_str());
  
  _getBufferInfo(info[0].ToObject(), (void **)(&bufferData), &bufferLength);
  RecognizeWorker *asyncWorker = new RecognizeWorker(
      bufferData,
      bufferLength,
      lang,
      callback);

  asyncWorker->Queue();
}
