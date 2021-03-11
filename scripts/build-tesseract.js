var path = require('path');
var shell = require('shelljs');

shell.config.fatal = true; // thrown an exception on any error

const cmakeBuildType = 'Release';

const commonEnvVariables = {
  CMAKE_BUILD_TYPE: cmakeBuildType,
  CMAKE_INSTALL_PREFIX: '${PWD}/bin',
  BUILD_SHARED_LIBS: 'OFF',
  CMAKE_POSITION_INDEPENDENT_CODE: 'ON',
  CMAKE_MSVC_RUNTIME_LIBRARY: 'MultiThreaded',
  CMAKE_POLICY_DEFAULT_CMP0091: 'NEW',
  CMAKE_OSX_DEPLOYMENT_TARGET: '10.9'
}

// ------ startup ------
shell.echo('build-tesseract script start.');

if (!shell.which('git')) {
  shell.echo('This script requires Git.');
  shell.exit(1);
}

checkCMakeVersion();

const homeDir = path.resolve(__dirname,'..');
shell.cd(homeDir);
shell.echo(`Working directory: ${homeDir}`);

// ------ submodules ------
shell.echo('Initializing Git submodules.');
if (process.platform === 'win32') {
  // https://stackoverflow.com/questions/49256190/how-to-fix-git-sh-setup-file-not-found-in-windows/50833818
  shell.env['PATH'] = `${shell.env['PATH']};C:\\Program Files\\Git\\usr\\bin;C:\\Program Files\\Git\\mingw64\\libexec\\git-core`;
}
shell.exec('git submodule update --init');

// ------ libraries ------
buildLibjpeg ('libjpeg');
buildLeptonica ('leptonica');
buildTesseract ('tesseract');

shell.echo('build-tesseract script end.');

function checkCMakeVersion() {
  const requiredVer = '3.15';
  let versionOK = false;
  shell.echo(`This script requires CMake version ${requiredVer} or later.`);
  if (!shell.which('cmake')) {
    shell.echo('CMake not found on this system.');
  } else {
    const reply = shell.exec('cmake --version', {silent: true});
    foundVersion = (/\d+.\d+.\d+/mg).exec(reply)[0];
    versionOK = checkVersion(foundVersion, requiredVer) >= 0;
    if (versionOK) {
      shell.echo(`CMake ${foundVersion} found on this system.`);
    } else {
      shell.echo(`CMake ${foundVersion} found on this system is too old.`);
    }
  }

  if (!versionOK) shell.exit(1);
}

// https://codereview.stackexchange.com/questions/236647/comparing-version-numbers-with-javascript
function checkVersion (a, b) {
  const x = a.split('.').map(e => parseInt(e, 10));
  const y = b.split('.').map(e => parseInt(e, 10));

  for (const i in x) {
      y[i] = y[i] || 0;
      if (x[i] === y[i]) {
          continue;
      } else if (x[i] > y[i]) {
          return 1;
      } else {
          return -1;
      }
  }
  return y.length > x.length ? -1 : 0;
}

function buildLibjpeg (dirName) {
  shell.echo('Building libjpeg.');

  if (shell.test('-e', dirName)) {
    shell.echo(`The ${dirName} directory already exists.`);
  } else {
    shell.exec(`git clone https://github.com/tamaskenez/libjpeg-cmake.git ${dirName}`);
  }

  runCMakeBuild (dirName, cmakeBuildType);
}

function buildLeptonica (dirName) {
  shell.echo('Building Leptonica.');

  runCMakeBuild (dirName, cmakeBuildType, {
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

  runCMakeBuild (dirName, cmakeBuildType, {
    STATIC: 'ON',
    CPPAN_BUILD: 'OFF',
    BUILD_TRAINING_TOOLS: 'OFF',
    Leptonica_DIR: '../leptonica/build'
  });
}

function runCMakeBuild (dirName, cmakeConfig, envVars) {
  createAndEnterBuildDir(dirName);

  let cmakeCmd = 'cmake';
  cmakeCmd += formatEnvVars (envVars);
  cmakeCmd += formatEnvVars (commonEnvVariables);
  cmakeCmd += ' ..';

  shell.echo(`Configuring a ${cmakeConfig} build.`)
  shell.echo(cmakeCmd);
  shell.exec(cmakeCmd);

  shell.echo(`Creating a ${cmakeConfig} build.`)
  shell.exec(`cmake --build . --parallel --config ${cmakeConfig}`);

  shell.echo(`Installing a ${cmakeConfig} build.`)
  shell.exec('cmake --install .');

  leaveBuildDir();
}

function createAndEnterBuildDir (dirName) {
  shell.pushd('-q', dirName);
  if (!shell.test('-e', 'build')) shell.mkdir('build');
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
