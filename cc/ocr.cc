#include "ocr.h"

#include <cstdio>
#include <cstdlib>
#include <cstring>

namespace {

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

}


int TessRecognizePix (Pix *image,
                      const char *lang, const char *datapath, bool tsvOutput, char *&outText, 
                      char *error_code, char *error_message) {

  NativeDebug("native: TessRecognizePix create api");

  tesseract::TessBaseAPI *api = new tesseract::TessBaseAPI();

  NativeDebug("native: TessRecognizePix api init start");
  int failed = api->Init(datapath, lang);
  NativeDebug("native: TessRecognizePix api init done");
  if (failed != 0) {
    pixDestroy(&image);

    const char *code = "ERR_INIT_TESSER";
    const char *message = "Could not initialize tesseract.";
    strcpy(error_code, code);
    strcpy(error_message, message);

    return failed;
  }

  NativeDebug("native: TessRecognizePix set image");
  api->SetImage(image);
  pixDestroy(&image);

  // Get OCR result
  if(tsvOutput){
    NativeDebug("native: TessRecognizePix get tsv");
    outText = api->GetTSVText(0);
  } else {
    NativeDebug("native: TessRecognizePix get utf8");
    outText = api->GetUTF8Text();
  }

  // Destroy used object and release memory
  NativeDebug("native: TessRecognizePix api end");
  api->End();

  return 0;
}
