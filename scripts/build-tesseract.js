var path = require('path');
const { env } = require('process');
var shell = require('shelljs');

const commonEnvVariables = {
  CMAKE_INSTALL_PREFIX: '${PWD}/bin',
  BUILD_SHARED_LIBS: 'OFF',
  CMAKE_POSITION_INDEPENDENT_CODE: 'ON',
  CMAKE_MSVC_RUNTIME_LIBRARY: 'MultiThreaded',
  CMAKE_POLICY_DEFAULT_CMP0091: 'NEW',
  CMAKE_OSX_DEPLOYMENT_TARGET: '10.9'
}

const cmakeConfig = 'Release';

if (!shell.which('git')) {
  shell.echo('This script requires Git.');
  shell.exit(1);
}

if (!shell.which('cmake')) {
  shell.echo('This script requires CMake.');
  shell.exit(1);
}

// ------ startup ------
shell.echo('build-tesseract script start.');

const homeDir = path.resolve(__dirname,'..');
shell.cd(homeDir);
shell.echo(`Working directory: ${homeDir}`);

// ------ submodules ------
shell.echo('Initializing Git submodules.');
shell.exec('git submodule update --init');

// ------ libraries ------
buildLibjpeg ('libjpeg');
buildLeptonica ('leptonica');
buildTesseract ('tesseract');

shell.echo('build-tesseract script end.');

function buildLibjpeg (dirName) {
  shell.echo('Building libjpeg.');

  if(shell.test('-e', dirName)) {
    shell.echo(`The ${dirName} directory already exists.`);
  } else {
    shell.exec(`git clone https://github.com/tamaskenez/libjpeg-cmake.git ${dirName}`);
  }

  runCMakeBuild (dirName, cmakeConfig);
}

function buildLeptonica (dirName) {
  shell.echo('Building Leptonica.');

  runCMakeBuild (dirName, cmakeConfig, {
    SW_BUILD: 'OFF',
    CMAKE_FIND_USE_CMAKE_SYSTEM_PATH: 'FALSE',
    CMAKE_FIND_USE_SYSTEM_ENVIRONMENT_PATH: process.platform === 'darwin' ? 'FALSE' : 'TRUE',
    CMAKE_PREFIX_PATH: '${PWD}/../../libjpeg/build',
    CMAKE_INCLUDE_PATH: '${PWD}/../../libjpeg/build/bin/include',
    CMAKE_LIBRARY_PATH: '${PWD}/../../libjpeg/build/bin/lib'
  });
}

function buildTesseract (dirName) {
  shell.echo('Building Tesseract.');

  runCMakeBuild (dirName, cmakeConfig, {
    STATIC: 'ON',
    CPPAN_BUILD: 'OFF',
    BUILD_TRAINING_TOOLS: 'OFF',
    Leptonica_DIR: '../leptonica/build'
  });
}

function runCMakeBuild (dirName, cmakeConfig, envVars) {
  recreateAndEnterBuildDir(dirName);

  let cmakeCmd = 'cmake';
  cmakeCmd += formatEnvVars (envVars);
  cmakeCmd += formatEnvVars (commonEnvVariables);
  cmakeCmd += ' ..';

  shell.echo(`Configuring a ${cmakeConfig} build.`)
  shell.echo(cmakeCmd);
  shell.exec(cmakeCmd);

  shell.echo(`Creating a ${cmakeConfig} build.`)
  shell.exec(`cmake --build . --config ${cmakeConfig}`);

  shell.echo(`Installing a ${cmakeConfig} build.`)
  shell.exec('cmake --install .');

  leaveBuildDir();
}

function recreateAndEnterBuildDir (dirName) {
  shell.pushd('-q', dirName);
  shell.rm('-rf','build');
  shell.mkdir('build');
  shell.pushd('-q', 'build');
}

function leaveBuildDir() {
  shell.popd('-q');
  shell.popd('-q');
}

function formatEnvVars (envVars) {
  const continuation = process.platform === 'win32' ? '' : ' \\\n';
  let args = '';
  for (key in envVars) {
    args += ` -D${key}=${envVars[key]}${continuation}`;
  }
  return args;
}
