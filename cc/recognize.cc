#include <napi.h>
#include <uv.h>
#include <stdint.h>
#include "recognize.h"
#include "ocr.h"

using Napi::Boolean;
using Napi::Env;
using Napi::Function;
using Napi::HandleScope;
using Napi::String;

class RecognizeWorker : public Napi::AsyncWorker
{

private:
  uint8_t *_buffer;
  size_t _length;
  std::string _lang;
  std::string _path;
  bool _tsvOutput;
  char *_outText;

  Pix *ReadImage()
  {
    return pixReadMem(_buffer, _length);
  }

public:
  RecognizeWorker(uint8_t *buffer,
                  size_t length,
                  std::string &lang,
                  std::string &path,
                  bool tsvOutput,
                  Function &callback)
      : Napi::AsyncWorker(callback), _buffer(buffer), _length(length), _lang(lang), _path(path), _tsvOutput(tsvOutput)
  {
  }

  ~RecognizeWorker() {}

  void OnOK() override
  {
    HandleScope scope(Env());
    Callback().Call({Env().Null(), String::New(Env(), _outText)});
  }

  void Execute() override
  {
    Pix *image = ReadImage();

    if (image == nullptr)
    {
      SetError("ERR_READ_IMAGE");
      return;
    }
    char error_code[50];
    char error_message[200];

    int tess_failed = TessRecognizePix(image, _lang.c_str(), _path.c_str(), _tsvOutput, _outText, error_code, error_message);

    if (tess_failed)
    {
      printf(error_message);
      SetError(error_code);
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

  if (info.Length() < 4)
  {
    Napi::TypeError::New(env, "Invalid argument count").ThrowAsJavaScriptException();
    return;
  }

  if (!info[1].IsString())
  {
    Napi::TypeError::New(env, "2. param needs to be a string!").ThrowAsJavaScriptException();
    return;
  }

  if (!info[2].IsString())
  {
    Napi::TypeError::New(env, "3. param needs to be a string!").ThrowAsJavaScriptException();
    return;
  }

  if (!info[4].IsFunction())
  {
    Napi::TypeError::New(env, "4. argument needs to be a callback!").ThrowAsJavaScriptException();
    return;
  }
  size_t bufferLength;
  uint8_t *bufferData;
  std::string lang = info[1].As<String>().Utf8Value();
  std::string tessDataPath = info[2].As<String>().Utf8Value();
  bool tsvOutput = info[3].As<Boolean>();
  Function callback = info[4].As<Function>();

  // printf("\n\nlang: %s\n", lang.c_str());

  _getBufferInfo(info[0].ToObject(), (void **)(&bufferData), &bufferLength);
  RecognizeWorker *asyncWorker = new RecognizeWorker(
      bufferData,
      bufferLength,
      lang,
      tessDataPath,
      tsvOutput,
      callback);

  asyncWorker->Queue();
}
