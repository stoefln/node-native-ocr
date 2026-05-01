#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const packageRootPath = path.resolve(__dirname, '..')
const RequiredWindowsRuntimeDlls = ['concrt140.dll', 'msvcp140.dll', 'msvcp140_1.dll', 'vcruntime140.dll', 'vcruntime140_1.dll']
const runtimeSourceDirs = [
  path.join(packageRootPath, 'tesseract', 'build', 'bin', 'bin'),
  path.join(packageRootPath, 'leptonica', 'build', 'bin', 'bin'),
  path.join(packageRootPath, 'libtiff', 'build', 'bin', 'bin'),
  path.join(packageRootPath, 'libpng', 'build', 'bin', 'bin'),
  path.join(packageRootPath, 'libjpeg', 'build', 'bin', 'bin'),
  path.join(packageRootPath, 'zlib', 'build', 'bin', 'bin')
]

/**
 * @param {string} dirPath
 * @returns {boolean}
 */
function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory()
  } catch (error) {
    return false
  }
}

/**
 * @param {string} dirPath
 * @returns {boolean}
 */
function hasAddonFile(dirPath) {
  if (!dirExists(dirPath)) {
    return false
  }

  return fs.readdirSync(dirPath).some(name => name.toLowerCase().endsWith('.node'))
}

/**
 * @returns {Map<string, string>}
 */
function getRuntimeDlls() {
  /** @type {Map<string, string>} */
  const dlls = new Map()

  for (const dirPath of runtimeSourceDirs) {
    if (!dirExists(dirPath)) {
      continue
    }

    for (const name of fs.readdirSync(dirPath)) {
      if (!name.toLowerCase().endsWith('.dll')) {
        continue
      }

      dlls.set(name.toLowerCase(), path.join(dirPath, name))
    }
  }

  return dlls
}

/**
 * @returns {string}
 */
function getWindowsRuntimeArch() {
  if (process.arch === 'arm64') {
    return 'arm64'
  }

  return 'x64'
}

/**
 * @param {string} dirPath
 * @returns {string[]}
 */
function getChildDirectories(dirPath) {
  if (!dirExists(dirPath)) {
    return []
  }

  return fs.readdirSync(dirPath, {withFileTypes: true}).filter(entry => entry.isDirectory()).map(entry => path.join(dirPath, entry.name))
}

/**
 * @returns {string[]}
 */
function getVisualStudioRuntimeCandidateDirs() {
  const runtimeArch = getWindowsRuntimeArch()
  const candidates = []
  const redistRootCandidates = []

  if (process.env.VCToolsRedistDir) {
    redistRootCandidates.push(process.env.VCToolsRedistDir)
  }

  if (process.env.VCToolsInstallDir) {
    redistRootCandidates.push(path.resolve(process.env.VCToolsInstallDir, '..', '..', 'Redist', 'MSVC'))
  }

  if (process.env.VCINSTALLDIR) {
    redistRootCandidates.push(path.join(process.env.VCINSTALLDIR, 'Redist', 'MSVC'))
  }

  const visualStudioRoots = [
    'C:/Program Files/Microsoft Visual Studio',
    'C:/Program Files (x86)/Microsoft Visual Studio'
  ]

  for (const visualStudioRoot of visualStudioRoots) {
    for (const yearDir of getChildDirectories(visualStudioRoot)) {
      for (const editionDir of getChildDirectories(yearDir)) {
        redistRootCandidates.push(path.join(editionDir, 'VC', 'Redist', 'MSVC'))
      }
    }
  }

  for (const redistRoot of redistRootCandidates) {
    if (!dirExists(redistRoot)) {
      continue
    }

    const versionDirs = getChildDirectories(redistRoot)
    if (versionDirs.length === 0 && path.basename(redistRoot).toLowerCase().startsWith('14.')) {
      versionDirs.push(redistRoot)
    }

    for (const versionDir of versionDirs) {
      const archDir = path.join(versionDir, runtimeArch)
      if (!dirExists(archDir)) {
        continue
      }

      for (const runtimeDir of getChildDirectories(archDir)) {
        candidates.push(runtimeDir)
      }
    }
  }

  return Array.from(new Set(candidates.map(candidate => path.normalize(candidate))))
}

/**
 * @returns {Map<string, string>}
 */
function getVisualStudioRuntimeDlls() {
  /** @type {Map<string, string>} */
  const dlls = new Map()

  for (const dirPath of getVisualStudioRuntimeCandidateDirs()) {
    for (const fileName of RequiredWindowsRuntimeDlls) {
      const sourcePath = path.join(dirPath, fileName)
      if (fs.existsSync(sourcePath)) {
        dlls.set(fileName, sourcePath)
      }
    }

    if (RequiredWindowsRuntimeDlls.every(fileName => dlls.has(fileName))) {
      return dlls
    }
  }

  const missingDlls = RequiredWindowsRuntimeDlls.filter(fileName => !dlls.has(fileName))
  throw new Error(
    `sync-windows-dlls: could not locate required MSVC runtime DLLs: ${missingDlls.join(', ')}`
  )
}

/**
 * @param {string} dirPath
 * @returns {string[]}
 */
function findWindowsAddonDirs(dirPath) {
  if (!dirExists(dirPath)) {
    return []
  }

  /** @type {string[]} */
  const matches = []
  const stack = [dirPath]

  while (stack.length > 0) {
    const currentDir = stack.pop()
    if (!currentDir) {
      continue
    }

    if (hasAddonFile(currentDir)) {
      const relativeDir = path.relative(dirPath, currentDir).replace(/\\/g, '/')
      if (relativeDir === 'win32-x64' || relativeDir.startsWith('win32-')) {
        matches.push(currentDir)
      }
      continue
    }

    for (const entry of fs.readdirSync(currentDir, {withFileTypes: true})) {
      if (entry.isDirectory()) {
        stack.push(path.join(currentDir, entry.name))
      }
    }
  }

  return matches
}

/**
 * @returns {string[]}
 */
function getAddonTargetDirs() {
  /** @type {string[]} */
  const dirs = []
  const buildReleaseDir = path.join(packageRootPath, 'build', 'Release')
  const prebuildsDir = path.join(packageRootPath, 'prebuilds')

  if (hasAddonFile(buildReleaseDir)) {
    dirs.push(buildReleaseDir)
  }

  for (const dirPath of findWindowsAddonDirs(prebuildsDir)) {
    dirs.push(dirPath)
  }

  return dirs
}

function main() {
  if (process.platform !== 'win32') {
    console.log('sync-windows-dlls: skipping non-Windows platform')
    return
  }

  const addonTargetDirs = getAddonTargetDirs()
  if (addonTargetDirs.length === 0) {
    console.log('sync-windows-dlls: no Windows addon targets found')
    return
  }

  const runtimeDlls = getRuntimeDlls()
  if (runtimeDlls.size === 0) {
    throw new Error('sync-windows-dlls: no runtime DLLs found in native dependency build outputs')
  }

  const visualStudioRuntimeDlls = getVisualStudioRuntimeDlls()
  for (const [fileName, sourcePath] of visualStudioRuntimeDlls.entries()) {
    runtimeDlls.set(fileName, sourcePath)
  }

  for (const targetDir of addonTargetDirs) {
    for (const sourcePath of runtimeDlls.values()) {
      fs.copyFileSync(sourcePath, path.join(targetDir, path.basename(sourcePath)))
    }

    console.log(
      `sync-windows-dlls: copied ${String(runtimeDlls.size)} DLLs next to addon files in ${targetDir}`
    )
  }
}

main()