const { join } = require('path');
const path = require('path');
const shell = require('shelljs');
const homeDir = path.resolve(__dirname,'..');

shell.cd(homeDir);
shell.echo(`Working directory: ${homeDir}`);

// ------ submodules ------
shell.echo('Initializing Git submodules.');
if (process.platform === 'win32') {
  // https://stackoverflow.com/questions/49256190/how-to-fix-git-sh-setup-file-not-found-in-windows/50833818
  shell.env['PATH'] = `${shell.env['PATH']};C:\\Program Files\\Git\\usr\\bin;C:\\Program Files\\Git\\mingw64\\libexec\\git-core`;
}
shell.echo('git submodule init start.')
shell.exec('git submodule update --init');
shell.echo('git submodule init end.')
