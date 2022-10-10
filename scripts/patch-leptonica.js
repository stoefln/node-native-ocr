const { join } = require('path');
const path = require('path');
const shell = require('shelljs');

const homeDir = path.resolve(__dirname,'..');
shell.cd(homeDir);
shell.echo(`Working directory: ${homeDir}`);

applyPatchFile('leptonica_cmakelists.patch', 'leptonica');

function applyPatchFile(filename, workingDirectory) {
  const fullPatchFilePath = join(homeDir, 'patches', filename);
  shell.echo(`Applying patch ${fullPatchFilePath}`);
  shell.exec(`git apply ${fullPatchFilePath} --directory=${workingDirectory} --ignore-space-change --ignore-whitespace`);
}
