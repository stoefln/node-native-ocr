# About these scripts

These three [ShellJS](https://github.com/shelljs/shelljs#shelljs---unix-shell-commands-for-nodejs) scripts are used to build the Tesseract, Leptonica, and Jpeg libraries using [CMake](https://cmake.org) version 3.15 or later. The resulting library binaries are then incorporated into the Node.js native binding file when `node-gyp` is run to build the binding.

## build-tesseract.js

The Tesseract and Leptonica libraries are configured as submodules. This script downloads a specific commit of these libraries using a `git submodule update --init` command.

For each of the three libraries, this script runs a CMake configuration, build, and install. The install directory for each library is the `build/bin` directory in the library's root directory.

This script is run from the `package.json` `install` script.

### Leptonica

The Leptonica library has a special requirement for macOS builds. Specifically, the `HAVE_FMEMOPEN` macro value must be set to `0`. This requires replacing the `HAVE_FMEMOPEN` macro definition in the `build/src/config_auto.h` file. This script contains code to replace the value between the configuration and build steps.

## clean-tesseract.js

CMake caches specific build information between builds. This script can be run to remove all CMake build products and CMake cache information.

## prepack.js

This script removes directories under the `tesseract`, `leptonica` and `libjpeg` directories the are not essential for building the binding. This incudes the `.git` directories under each of the above directories and the `leptonica/prog` directory. The objective is to minimize the size of the published npm module.

This script is run from the `package.json` `prepack` script.
