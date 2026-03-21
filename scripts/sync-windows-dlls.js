#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const packageRootPath = path.resolve(__dirname, '..')
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