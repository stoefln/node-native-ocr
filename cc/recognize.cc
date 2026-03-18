#include <napi.h>
#include <uv.h>
#include <stdint.h>
#include <cstdio>
#include <cstring>
#include <fstream>
#include <string>
#include <vector>
#ifdef _WIN32
#include <windows.h>
#include <gdiplus.h>
#include <objidl.h>
#endif
#include "recognize.h"
#include "ocr.h"

using Napi::Boolean;
using Napi::Env;
using Napi::Function;
using Napi::HandleScope;
using Napi::String;

bool NativeDebugEnabled()
{
  const char *value = std::getenv("NODE_NATIVE_OCR_DEBUG_NATIVE");
  return value != nullptr && value[0] != '\0' && std::strcmp(value, "0") != 0;
}

void NativeDebug(const char *message)
{
  if (!NativeDebugEnabled())
  {
    return;
  }

  fprintf(stderr, "%s\n", message);
  fflush(stderr);
}

Pix *ReadImageWithGdiPlus(const uint8_t *buffer, size_t length)
{
#ifdef _WIN32
  static ULONG_PTR gdiplusToken = 0;
  static bool gdiplusInitialized = false;

  if (!gdiplusInitialized)
  {
    Gdiplus::GdiplusStartupInput startupInput;
    if (Gdiplus::GdiplusStartup(&gdiplusToken, &startupInput, NULL) != Gdiplus::Ok)
    {
      NativeDebug("native: GDI+ startup failed");
      return nullptr;
    }
    gdiplusInitialized = true;
  }

  HGLOBAL memory = GlobalAlloc(GMEM_MOVEABLE, length);
  if (memory == NULL)
  {
    NativeDebug("native: GDI+ GlobalAlloc failed");
    return nullptr;
  }

  void *memoryData = GlobalLock(memory);
  if (memoryData == NULL)
  {
    GlobalFree(memory);
    NativeDebug("native: GDI+ GlobalLock failed");
    return nullptr;
  }

  std::memcpy(memoryData, buffer, length);
  GlobalUnlock(memory);

  IStream *stream = nullptr;
  if (CreateStreamOnHGlobal(memory, TRUE, &stream) != S_OK)
  {
    GlobalFree(memory);
    NativeDebug("native: GDI+ CreateStreamOnHGlobal failed");
    return nullptr;
  }

  Gdiplus::Bitmap bitmap(stream, FALSE);
  stream->Release();

  if (bitmap.GetLastStatus() != Gdiplus::Ok)
  {
    NativeDebug("native: GDI+ Bitmap load failed");
    return nullptr;
  }

  const int width = static_cast<int>(bitmap.GetWidth());
  const int height = static_cast<int>(bitmap.GetHeight());
  if (width <= 0 || height <= 0)
  {
    NativeDebug("native: GDI+ invalid image size");
    return nullptr;
  }

  Gdiplus::Rect rect(0, 0, width, height);
  Gdiplus::BitmapData bitmapData;
  if (bitmap.LockBits(&rect, Gdiplus::ImageLockModeRead, PixelFormat32bppARGB, &bitmapData) != Gdiplus::Ok)
  {
    NativeDebug("native: GDI+ LockBits failed");
    return nullptr;
  }

  Pix *image = pixCreate(width, height, 32);
  if (image == nullptr)
  {
    bitmap.UnlockBits(&bitmapData);
    NativeDebug("native: pixCreate failed");
    return nullptr;
  }

  l_uint32 *pixData = pixGetData(image);
  const l_int32 wpl = pixGetWpl(image);
  const int stride = bitmapData.Stride;
  const uint8_t *scan0 = static_cast<const uint8_t *>(bitmapData.Scan0);

  for (int y = 0; y < height; y += 1)
  {
    const uint8_t *srcLine = stride >= 0
        ? scan0 + (y * stride)
        : scan0 + ((height - 1 - y) * (-stride));
    l_uint32 *dstLine = pixData + (y * wpl);

    for (int x = 0; x < width; x += 1)
    {
      const uint8_t blue = srcLine[(x * 4) + 0];
      const uint8_t green = srcLine[(x * 4) + 1];
      const uint8_t red = srcLine[(x * 4) + 2];
      composeRGBPixel(red, green, blue, dstLine + x);
    }
  }

  bitmap.UnlockBits(&bitmapData);
  NativeDebug("native: GDI+ decode ok");
  return image;
#else
  return nullptr;
#endif
}

const char *DetectImageExtension(const uint8_t *buffer, size_t length)
{
  if (length >= 3 && buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF)
  {
    return ".jpg";
  }

  if (length >= 8 &&
      buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47 &&
      buffer[4] == 0x0D && buffer[5] == 0x0A && buffer[6] == 0x1A && buffer[7] == 0x0A)
  {
    return ".png";
  }

  if (length >= 4 &&
      ((buffer[0] == 0x49 && buffer[1] == 0x49 && buffer[2] == 0x2A && buffer[3] == 0x00) ||
       (buffer[0] == 0x4D && buffer[1] == 0x4D && buffer[2] == 0x00 && buffer[3] == 0x2A)))
  {
    return ".tif";
  }

  if (length >= 2 && buffer[0] == 0x42 && buffer[1] == 0x4D)
  {
    return ".bmp";
  }

  if (length >= 6 && std::memcmp(buffer, "GIF87a", 6) == 0)
  {
    return ".gif";
  }

  if (length >= 6 && std::memcmp(buffer, "GIF89a", 6) == 0)
  {
    return ".gif";
  }

  if (length >= 12 &&
      std::memcmp(buffer, "RIFF", 4) == 0 &&
      std::memcmp(buffer + 8, "WEBP", 4) == 0)
  {
    return ".webp";
  }

  return ".img";
}

Pix *ReadImageFromMemoryByType(const uint8_t *buffer, size_t length)
{
  const char *extension = DetectImageExtension(buffer, length);

  if (std::strcmp(extension, ".png") == 0)
  {
    NativeDebug("native: ReadImageFromBuffer pixReadMemPng");
    return pixReadMemPng(buffer, length);
  }

  if (std::strcmp(extension, ".tif") == 0)
  {
    NativeDebug("native: ReadImageFromBuffer pixReadMemTiff");
    return pixReadMemTiff(buffer, length, 0);
  }

  if (std::strcmp(extension, ".bmp") == 0)
  {
    NativeDebug("native: ReadImageFromBuffer pixReadMemBmp");
    return pixReadMemBmp(buffer, length);
  }

  if (std::strcmp(extension, ".gif") == 0)
  {
    NativeDebug("native: ReadImageFromBuffer pixReadMemGif");
    return pixReadMemGif(buffer, length);
  }

  if (std::strcmp(extension, ".webp") == 0)
  {
    NativeDebug("native: ReadImageFromBuffer pixReadMemWebP");
    return pixReadMemWebP(buffer, length);
  }

  return nullptr;
}

Pix *ReadImageFromTempFileByType(const uint8_t *buffer, size_t length)
{
#ifdef _WIN32
  char tempPath[MAX_PATH];
  if (GetTempPathA(MAX_PATH, tempPath) <= 0)
  {
    return nullptr;
  }

  char tempFile[MAX_PATH];
  if (GetTempFileNameA(tempPath, "ocr", 0, tempFile) <= 0)
  {
    return nullptr;
  }

  const char *extension = DetectImageExtension(buffer, length);
  const std::string imagePath = std::string(tempFile) + extension;
  DeleteFileA(tempFile);

  std::ofstream tempStream(imagePath.c_str(), std::ios::binary | std::ios::out | std::ios::trunc);
  if (!tempStream.is_open())
  {
    DeleteFileA(imagePath.c_str());
    return nullptr;
  }

  tempStream.write(reinterpret_cast<const char *>(buffer), static_cast<std::streamsize>(length));
  tempStream.close();

  Pix *image = nullptr;
  if (std::strcmp(extension, ".jpg") == 0)
  {
    NativeDebug("native: ReadImageFromBuffer pixReadJpeg file");
    image = pixReadJpeg(imagePath.c_str(), 0, 1, NULL, 0);
  }
  else if (std::strcmp(extension, ".tif") == 0)
  {
    NativeDebug("native: ReadImageFromBuffer pixReadTiff file");
    image = pixReadTiff(imagePath.c_str(), 0);
  }

  DeleteFileA(imagePath.c_str());
  return image;
#else
  return nullptr;
#endif
}

Pix *ReadImageFromBuffer(const uint8_t *buffer, size_t length)
{
  NativeDebug("native: ReadImageFromBuffer enter");
#ifdef _WIN32
  Pix *gdiImage = ReadImageWithGdiPlus(buffer, length);
  if (gdiImage != nullptr)
  {
    NativeDebug("native: ReadImageFromBuffer GDI+ ok");
    return gdiImage;
  }

  Pix *fileImage = ReadImageFromTempFileByType(buffer, length);
  if (fileImage != nullptr)
  {
    NativeDebug("native: ReadImageFromBuffer direct file decoder ok");
    return fileImage;
  }

  Pix *image = ReadImageFromMemoryByType(buffer, length);
  if (image != nullptr)
  {
    NativeDebug("native: ReadImageFromBuffer memory decoder ok");
    return image;
  }

  NativeDebug("native: ReadImageFromBuffer memory decoder unavailable; fallback to temp file");

  char tempPath[MAX_PATH];
  if (GetTempPathA(MAX_PATH, tempPath) > 0)
  {
    char tempFile[MAX_PATH];
    if (GetTempFileNameA(tempPath, "ocr", 0, tempFile) > 0)
    {
      std::string imagePath = std::string(tempFile) + DetectImageExtension(buffer, length);
      DeleteFileA(tempFile);

      std::ofstream tempStream(imagePath.c_str(), std::ios::binary | std::ios::out | std::ios::trunc);
      if (tempStream.is_open())
      {
        tempStream.write(reinterpret_cast<const char *>(buffer), static_cast<std::streamsize>(length));
        tempStream.close();
        NativeDebug("native: ReadImageFromBuffer pixRead temp file");
        image = pixRead(imagePath.c_str());
        DeleteFileA(imagePath.c_str());
        NativeDebug(image == nullptr ? "native: ReadImageFromBuffer temp pixRead failed" : "native: ReadImageFromBuffer temp pixRead ok");
        return image;
      }
      DeleteFileA(imagePath.c_str());
    }
  }
#endif
  NativeDebug("native: ReadImageFromBuffer pixReadMem");
  Pix *fallbackImage = pixReadMem(buffer, length);
  NativeDebug(fallbackImage == nullptr ? "native: ReadImageFromBuffer pixReadMem failed" : "native: ReadImageFromBuffer pixReadMem ok");
  return fallbackImage;
}

bool RecognizeBuffer(const uint8_t *buffer,
                     size_t length,
                     const std::string &lang,
                     const std::string &path,
                     bool tsvOutput,
                     std::string *result,
                     std::string *errorCode)
{
  NativeDebug("native: RecognizeBuffer enter");
  Pix *image = ReadImageFromBuffer(buffer, length);
  if (image == nullptr)
  {
    NativeDebug("native: RecognizeBuffer image read failed");
    *errorCode = "ERR_READ_IMAGE";
    return false;
  }

  char tessErrorCode[50] = {0};
  char tessErrorMessage[200] = {0};
  char *outText = nullptr;
  NativeDebug("native: RecognizeBuffer TessRecognizePix start");
  const int tessFailed = TessRecognizePix(
      image,
      lang.c_str(),
      path.c_str(),
      tsvOutput,
      outText,
      tessErrorCode,
      tessErrorMessage);
  NativeDebug("native: RecognizeBuffer TessRecognizePix done");

  if (tessFailed != 0)
  {
    if (tessErrorMessage[0] != '\0')
    {
      fprintf(stderr, "%s", tessErrorMessage);
      fflush(stderr);
    }
    *errorCode = tessErrorCode[0] == '\0' ? "ERR_INIT_TESSER" : tessErrorCode;
    delete[] outText;
    return false;
  }

  result->assign(outText == nullptr ? "" : outText);
  delete[] outText;
  NativeDebug("native: RecognizeBuffer success");
  return true;
}

class RecognizeWorker : public Napi::AsyncWorker
{

private:
  std::vector<uint8_t> _buffer;
  std::string _lang;
  std::string _path;
  bool _tsvOutput;
  std::string _result;

public:
  RecognizeWorker(const uint8_t *buffer,
                  size_t length,
                  std::string &lang,
                  std::string &path,
                  bool tsvOutput,
                  Function &callback)
      : Napi::AsyncWorker(callback), _buffer(buffer, buffer + length), _lang(lang), _path(path), _tsvOutput(tsvOutput)
  {
  }

  ~RecognizeWorker() {}

  void OnOK() override
  {
    HandleScope scope(Env());
    Callback().Call({Env().Null(), String::New(Env(), _result)});
  }

  void Execute() override
  {
    std::string errorCode;
    if (!RecognizeBuffer(_buffer.data(), _buffer.size(), _lang, _path, _tsvOutput, &_result, &errorCode))
    {
      SetError(errorCode);
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

  if (info.Length() < 5)
  {
    Napi::TypeError::New(env, "Invalid argument count").ThrowAsJavaScriptException();
    return;
  }

  if (!info[0].IsBuffer())
  {
    Napi::TypeError::New(env, "1. param needs to be a Buffer!").ThrowAsJavaScriptException();
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

#ifdef _WIN32
  NativeDebug("native: Recognize sync path start");
  std::string result;
  std::string errorCode;
  if (!RecognizeBuffer(bufferData, bufferLength, lang, tessDataPath, tsvOutput, &result, &errorCode))
  {
    NativeDebug("native: Recognize sync path error");
    callback.Call({Napi::Error::New(env, errorCode).Value()});
    return;
  }

  NativeDebug("native: Recognize sync path callback success");
  callback.Call({env.Null(), String::New(env, result)});
  return;
#endif

  RecognizeWorker *asyncWorker = new RecognizeWorker(
      bufferData,
      bufferLength,
      lang,
      tessDataPath,
      tsvOutput,
      callback);

  asyncWorker->Queue();
}
