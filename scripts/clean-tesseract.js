var path = require('path');
var shell = require('shelljs');

shell.config.fatal = true; // thrown an exception on any error

function removeBuildDir (dirName) {
  if (shell.test('-e', dirName)) {
    shell.pushd('-q', dirName);
    if (shell.test('-e', 'build')) {
      shell.rm('-rf', 'build');
      shell.echo(`${dirName} build directory removed.`);
    } else {
      shell.echo(`${dirName} build directory does not exist.`);
    }
    shell.popd('-q');
  }
}

shell.echo('clean-tesseract script start.');

const homeDir = path.resolve(__dirname,'..');
shell.cd(homeDir);
shell.echo(`Working directory: ${homeDir}`);

removeBuildDir('libjpeg');
removeBuildDir('leptonica');
removeBuildDir('tesseract');

shell.echo('clean-tesseract script end.');
