const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const process = require('process')

const requiredCMakeVersion = '3.15'
const cmakeBuildType = 'Release'

shell.config.fatal = true // thrown an exception on any error

let commonEnvVariables = {
  CMAKE_BUILD_TYPE: cmakeBuildType,
  CMAKE_INSTALL_PREFIX: '${PWD}/bin',
  BUILD_SHARED_LIBS: 'OFF',
  CMAKE_POSITION_INDEPENDENT_CODE: 'ON',
  CMAKE_MSVC_RUNTIME_LIBRARY: 'MultiThreaded',
  CMAKE_POLICY_DEFAULT_CMP0091: 'NEW',
  CMAKE_OSX_DEPLOYMENT_TARGET: '10.9'
}

const buildForArch = process.env['BUILD_FOR_ARCH'] || process.arch
shell.echo('buildForArch', buildForArch)

const dependencyPrefixPath =
  '"${PWD}/../../zlib/build/bin;${PWD}/../../libpng/build/bin;${PWD}/../../libjpeg/build/bin;${PWD}/../../libtiff/build/bin"'
const dependencyIncludePath =
  '"${PWD}/../../zlib/build/bin/include;${PWD}/../../libpng/build/bin/include;${PWD}/../../libjpeg/build/bin/include;${PWD}/../../libtiff/build/bin/include"'
const dependencyLibraryPath =
  '"${PWD}/../../zlib/build/bin/lib;${PWD}/../../libpng/build/bin/lib;${PWD}/../../libjpeg/build/bin/lib;${PWD}/../../libtiff/build/bin/lib"'

if (buildForArch === 'arm64') {
  shell.echo('arm64 build')
  commonEnvVariables = {
    ...commonEnvVariables,
    CMAKE_OSX_ARCHITECTURES: '"arm64"'
  }
} else if (buildForArch === 'x64') {
  shell.echo('x64 build')
  commonEnvVariables = {
    ...commonEnvVariables,
    CMAKE_OSX_ARCHITECTURES: '"x86_64"'
  }
}

// ------ startup ------
shell.echo('build-tesseract script start.')

if (!shell.which('git')) {
  shell.echo('This script requires Git.')
  shell.exit(1)
}

checkCMakeVersion()

const homeDir = path.resolve(__dirname, '..')
shell.cd(homeDir)
shell.echo(`Working directory: ${homeDir}`)

// ------ libraries ------
downloadAndBuildLib('https://github.com/madler/zlib.git', 'zlib')

downloadAndBuildLib(
  'https://github.com/glennrp/libpng.git',
  'libpng',
  null,
  {
    CMAKE_FIND_USE_CMAKE_SYSTEM_PATH: 'FALSE',
    CMAKE_FIND_USE_SYSTEM_ENVIRONMENT_PATH: 'TRUE',
    CMAKE_PREFIX_PATH: '"${PWD}/../../zlib/build/bin"',
    CMAKE_INCLUDE_PATH: '"${PWD}/../../zlib/build/bin/include"',
    CMAKE_LIBRARY_PATH: '"${PWD}/../../zlib/build/bin/lib"'
  }
)

downloadAndBuildLib('https://github.com/libjpeg-turbo/libjpeg-turbo.git', 'libjpeg')

downloadAndBuildLib(
  'https://github.com/libsdl-org/libtiff.git',
  'libtiff',
  dirName => {
  const filePath = path.resolve(__dirname, '..', dirName, 'CMakeLists.txt')
  shell.echo(`Patching ${filePath} for Mac.`)
  let cmakeConfig = fs.readFileSync(filePath, 'utf8')
  // disable codecs: otherwise we will get a linker error during compilation of tesseract
  cmakeConfig = cmakeConfig.replace('include(LZMACodec)', '# include(LZMACodec)')
  cmakeConfig = cmakeConfig.replace('include(WebPCodec)', '# include(WebPCodec)')
  cmakeConfig = cmakeConfig.replace('include(ZSTDCodec)', '# include(ZSTDCodec)')

  fs.writeFileSync(filePath, cmakeConfig, 'utf8')
  shell.echo(`Disabled LZMA, Webp and ZSTD Codecs. Not needed for tesseract.`)
  },
  {
    'tiff-tools': 'OFF',
    'tiff-tests': 'OFF',
    'tiff-contrib': 'OFF',
    'tiff-docs': 'OFF',
    CMAKE_FIND_USE_CMAKE_SYSTEM_PATH: 'FALSE',
    CMAKE_FIND_USE_SYSTEM_ENVIRONMENT_PATH: 'TRUE',
    CMAKE_PREFIX_PATH: dependencyPrefixPath,
    CMAKE_INCLUDE_PATH: dependencyIncludePath,
    CMAKE_LIBRARY_PATH: dependencyLibraryPath
  }
)

buildLeptonica('leptonica')
buildTesseract('tesseract')

shell.echo('build-tesseract script end.')

function checkCMakeVersion() {
  let versionOK = false
  shell.echo(`This script requires CMake version ${requiredCMakeVersion} or later.`)
  if (!shell.which('cmake')) {
    shell.echo('CMake not found on this system.')
  } else {
    const reply = shell.exec('cmake --version', { silent: true })
    foundVersion = /\d+.\d+.\d+/gm.exec(reply)[0]
    versionOK = checkVersion(foundVersion, requiredCMakeVersion) >= 0
    if (versionOK) {
      shell.echo(`CMake ${foundVersion} found on this system.`)
    } else {
      shell.echo(`CMake ${foundVersion} found on this system is too old.`)
    }
  }

  if (!versionOK) shell.exit(1)
}

// https://codereview.stackexchange.com/questions/236647/comparing-version-numbers-with-javascript
function checkVersion(a, b) {
  const x = a.split('.').map(e => parseInt(e, 10))
  const y = b.split('.').map(e => parseInt(e, 10))

  for (const i in x) {
    y[i] = y[i] || 0
    if (x[i] === y[i]) {
      continue
    } else if (x[i] > y[i]) {
      return 1
    } else {
      return -1
    }
  }
  return y.length > x.length ? -1 : 0
}

function downloadAndBuildLib(repoUrl, dirName, patchConfig, envVars) {
  printTitle('Building ' + dirName)

  if (shell.test('-e', dirName)) {
    shell.echo(`The ${dirName} directory already exists.`)
  } else {
    shell.exec(`git clone ${repoUrl} ${dirName}`)
  }

  if (patchConfig) patchConfig(dirName)
  runCMakeBuild(dirName, cmakeBuildType, envVars)
}

function buildLeptonica(dirName) {
  printTitle('\nBuilding Leptonica.')

  runCMakeBuild(
    dirName,
    cmakeBuildType,
    {
      SW_BUILD: 'OFF',
      CMAKE_FIND_USE_CMAKE_SYSTEM_PATH: 'FALSE',
      CMAKE_FIND_USE_SYSTEM_ENVIRONMENT_PATH: 'TRUE',
      CMAKE_PREFIX_PATH: dependencyPrefixPath,
      CMAKE_INCLUDE_PATH: dependencyIncludePath,
      CMAKE_LIBRARY_PATH: dependencyLibraryPath
    },
    (dirName, cmakeConfig, envVars) => {
      // patch config_auto.h between config and build
      if (process.platform === 'darwin') {
        const filePath = path.resolve(__dirname, '..', dirName, 'build', 'src', 'config_auto.h')
        shell.echo(`Patching ${filePath} for Mac.`)
        let autoConfig = fs.readFileSync(filePath, 'utf8')
        const searchText = /^#define\s+HAVE_FMEMOPEN\s+1/gm
        const replacementText = '#define HAVE_FMEMOPEN 0'
        const foundText = autoConfig.match(searchText)
        if (foundText) {
          const updatedConfig = autoConfig.replace(searchText, replacementText)
          fs.writeFileSync(filePath, updatedConfig, 'utf8')
          shell.echo(`The '${foundText}' directive was replaced with '${replacementText}'.`)
        } else {
          shell.echo(`The '#define HAVE_FMEMOPEN 1' directive was not found.`)
          shell.echo('This may lead to a build that does not run on all macOS machines.')
        }
      }
    }
  )

  const leptonicaConfigPath = path.resolve(__dirname, '..', dirName, 'build', 'LeptonicaConfig.cmake')
  if (fs.existsSync(leptonicaConfigPath)) {
    let configContent = fs.readFileSync(leptonicaConfigPath, 'utf8')
    if (!configContent.includes('include(CMakeFindDependencyMacro)')) {
      configContent =
        'include(CMakeFindDependencyMacro)\n' +
        'find_dependency(ZLIB)\n' +
        'find_dependency(PNG)\n' +
        'find_dependency(JPEG)\n' +
        'find_dependency(TIFF)\n\n' +
        configContent
      fs.writeFileSync(leptonicaConfigPath, configContent, 'utf8')
      shell.echo(`Patched ${leptonicaConfigPath} with find_dependency declarations.`)
    }
  }
}

function buildTesseract(dirName) {
  printTitle('\nBuilding Tesseract.')

  runCMakeBuild(dirName, cmakeBuildType, {
    STATIC: 'ON',
    CPPAN_BUILD: 'OFF',
    BUILD_TRAINING_TOOLS: 'OFF',
    AUTO_OPTIMIZE: 'OFF',
    Leptonica_DIR: '../leptonica/build',
    CMAKE_FIND_USE_CMAKE_SYSTEM_PATH: 'FALSE',
    CMAKE_FIND_USE_SYSTEM_ENVIRONMENT_PATH: 'TRUE',
    CMAKE_PREFIX_PATH: dependencyPrefixPath,
    CMAKE_INCLUDE_PATH: dependencyIncludePath,
    CMAKE_LIBRARY_PATH: dependencyLibraryPath
  })
}

function runCMakeBuild(dirName, cmakeBuildType, envVars, patchConfig) {
  createAndEnterBuildDir(dirName)

  let cmakeCmd = 'cmake'
  cmakeCmd += formatEnvVars(envVars)
  cmakeCmd += formatEnvVars(commonEnvVariables)
  cmakeCmd += ' ../ '

  shell.echo(`Configuring a ${cmakeBuildType} build.`)
  shell.echo(cmakeCmd)
  shell.exec(cmakeCmd)

  if (patchConfig) patchConfig(dirName, cmakeBuildType, envVars)

  shell.echo(`Creating a ${cmakeBuildType} build.`)
  shell.exec(`cmake --build . --config ${cmakeBuildType}`)

  shell.echo(`Installing a ${cmakeBuildType} build.`)
  shell.exec('cmake --install .')

  leaveBuildDir()
}

function createAndEnterBuildDir(dirName) {
  shell.pushd('-q', dirName)
  if (!shell.test('-e', 'build')) shell.mkdir('build')
  shell.pushd('-q', 'build')
}

function leaveBuildDir() {
  shell.popd('-q')
  shell.popd('-q')
}

function formatEnvVars(envVars) {
  const continuation = process.platform === 'win32' ? '' : ' \\\n'
  let args = ''
  for (key in envVars) {
    args += ` -D${key}=${envVars[key]}${continuation}`
  }
  return args
}

function printTitle(title) {
  console.log('\n' + '='.repeat(title.length))
  console.log(title)
  console.log('='.repeat(title.length))
}
