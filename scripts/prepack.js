var path = require('path');
var shell = require('shelljs');

shell.config.fatal = true; // thrown an exception on any error

function removeDirs (dirName, directoriesToDelete) {
  if (shell.test('-e', dirName)) {
    shell.pushd('-q', dirName);
    for (const dir of directoriesToDelete) {
      shell.rm('-rf', dir);
      shell.echo(`Directory ${dirName}${path.sep}${dir} removed.`)
    }
    shell.popd('-q');
  }
}

shell.echo('prepack script start.');

const homeDir = path.resolve(__dirname,'..');
shell.cd(homeDir);
shell.echo(`Working directory: ${homeDir}`);

removeDirs('libjpeg',   [ '.git' ]);
removeDirs('leptonica', [ '.git', 'prog' ]);
removeDirs('tesseract', [ '.git' ]);

shell.echo('prepack script end.');
