#!/usr/bin/env node

const {spawnSync} = require('child_process')
const path = require('path')

const RequiredElectronVersion = process.argv[2] || '40.8.0'
const PackageRootPath = path.resolve(__dirname, '..')
const NpxExecutable = process.platform === 'win32' ? 'npx.cmd' : 'npx'

/**
 * Filter out Windows pseudo env keys (for example "=C:") that can make spawnSync fail with EINVAL.
 * @returns {NodeJS.ProcessEnv}
 */
function getSpawnEnv() {
  if (process.platform !== 'win32') {
    return {...process.env}
  }

  /** @type {NodeJS.ProcessEnv} */
  const env = {}
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('=')) {
      continue
    }
    env[key] = process.env[key]
  }
  return env
}

/**
 * Run Electron in Node mode and return runtime versions JSON.
 * @param {string} version
 * @returns {{electron: string|null, napi: string|null}}
 */
function getElectronRuntimeVersions(version) {
  const probeCode = [
    "const out = { electron: process.versions.electron || null, napi: process.versions.napi || null };",
    "process.stdout.write(JSON.stringify(out));"
  ].join(' ')

  const result = spawnSync(NpxExecutable, ['-y', `electron@${version}`, '-e', probeCode], {
    cwd: PackageRootPath,
    env: {
      ...getSpawnEnv(),
      ELECTRON_RUN_AS_NODE: '1'
    },
    encoding: 'utf8'
  })

  if (result.error) {
    throw new Error(`Failed to spawn Electron ${version} probe: ${result.error.message}`)
  }

  if (result.status !== 0) {
    process.stderr.write(result.stdout || '')
    process.stderr.write(result.stderr || '')
    throw new Error(`Failed to execute Electron ${version} in node mode.`)
  }

  const stdout = (result.stdout || '').trim()
  const firstJsonStart = stdout.indexOf('{')
  const firstJsonEnd = stdout.lastIndexOf('}')
  if (firstJsonStart === -1 || firstJsonEnd === -1 || firstJsonEnd <= firstJsonStart) {
    throw new Error(`Could not parse Electron runtime versions from output: ${stdout}`)
  }

  return JSON.parse(stdout.slice(firstJsonStart, firstJsonEnd + 1))
}

/**
 * Ensure current module N-API requirement is compatible with target Electron runtime.
 * @param {{electron: string|null, napi: string|null}} versions
 */
function assertNapiCompatibility(versions) {
  const packageJson = require(path.join(PackageRootPath, 'package.json'))
  const declaredNapiVersions = Array.isArray(packageJson.binary && packageJson.binary.napi_versions)
    ? packageJson.binary.napi_versions
    : []

  if (declaredNapiVersions.length === 0) {
    throw new Error('package.json is missing binary.napi_versions.')
  }

  const minRequiredNapi = Math.min(...declaredNapiVersions)
  const electronNapi = Number(versions.napi)

  if (!Number.isFinite(electronNapi)) {
    throw new Error(`Electron did not report a numeric N-API version: ${String(versions.napi)}`)
  }

  if (electronNapi < minRequiredNapi) {
    throw new Error(
      `Electron N-API ${electronNapi} is lower than module minimum ${minRequiredNapi}.`
    )
  }

  console.log(
    `Electron ${versions.electron || 'unknown'} (N-API ${electronNapi}) is compatible with module minimum N-API ${minRequiredNapi}.`
  )
}

const versions = getElectronRuntimeVersions(RequiredElectronVersion)
assertNapiCompatibility(versions)
