#!/usr/bin/env node

const {spawnSync} = require('child_process')
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const ElectronVersion = process.argv[2] || '40.8.0'
const RepoRoot = path.resolve(__dirname, '..')
const FixturePath = path.join(RepoRoot, 'test', 'fixtures', 'test.jpg')
const TessdataPath = path.join(RepoRoot, 'tessdata')
const TempRoot = path.join(RepoRoot, 'temp', 'electron-bundle-smoke')
const AppRoot = path.join(TempRoot, 'resources', 'app')
const NpxExecutable = 'npx'

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
 * @param {string} command
 * @param {string[]} args
 * @param {import('child_process').SpawnSyncOptions} options
 */
function run(command, args, options) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		...options
	})

	if (result.error) {
		throw result.error
	}

	return result
}

/**
 * @param {import('child_process').SpawnSyncReturns<string>} result
 * @param {string} title
 */
function assertOk(result, title) {
	if (result.status === 0) {
		return
	}

	process.stderr.write(result.stdout || '')
	process.stderr.write(result.stderr || '')
	throw new Error(`${title} failed with exit code ${String(result.status)}.`)
}

/**
 * @param {string} dirPath
 */
function ensureCleanDir(dirPath) {
	fs.rmSync(dirPath, {recursive: true, force: true})
	fs.mkdirSync(dirPath, {recursive: true})
}

/**
 * @param {string} filePath
 * @param {string} content
 */
function writeUtf8(filePath, content) {
	fs.mkdirSync(path.dirname(filePath), {recursive: true})
	fs.writeFileSync(filePath, content, 'utf8')
}

/**
 * @param {string} targetPath
 * @param {string} sourcePath
 */
function createNodeModuleLink(targetPath, sourcePath) {
	fs.mkdirSync(path.dirname(targetPath), {recursive: true})
	if (process.platform === 'win32') {
		fs.symlinkSync(sourcePath, targetPath, 'junction')
		return
	}
	fs.symlinkSync(sourcePath, targetPath, 'dir')
}

function runDirectElectronSmoke() {
	const directProbeRoot = path.join(TempRoot, 'direct-probe')
	const directProbeScriptPath = path.join(directProbeRoot, 'main.js')

	ensureCleanDir(directProbeRoot)
	writeUtf8(
		directProbeScriptPath,
		[
			"const assert = require('assert')",
			"const fs = require('fs')",
			"const {app} = require('electron')",
			`const fixture = ${JSON.stringify(FixturePath)}`,
			`const mod = require(${JSON.stringify(path.join(RepoRoot, 'src'))})`,
			'',
			'app.whenReady().then(async () => {',
			'  try {',
			`    const txt = await mod.recognize(fs.readFileSync(fixture), {lang: 'eng', tessdataPath: ${JSON.stringify(TessdataPath)}, requireNonEmpty: true})`,
			"    assert.strictEqual(typeof txt, 'string')",
			"    assert.ok(txt.length > 0)",
			"    process.stdout.write('Electron main-process smoke test passed\\n')",
			'    app.exit(0)',
			'  } catch (error) {',
			'    console.error(error)',
			'    app.exit(1)',
			'  }',
			'})',
			''
		].join('\n')
	)

	const result = run(
		NpxExecutable,
		['-y', `electron@${ElectronVersion}`, directProbeScriptPath],
		{
			cwd: RepoRoot,
			shell: process.platform === 'win32',
			env: getSpawnEnv()
		}
	)

	assertOk(result, 'Electron direct smoke test')
	process.stdout.write(result.stdout || '')
}

function runBundledLayoutSmoke() {
	ensureCleanDir(AppRoot)

	const packageJsonPath = path.join(AppRoot, 'package.json')
	const mainPath = path.join(AppRoot, 'main.js')
	const linkedModulePath = path.join(AppRoot, 'node_modules', 'node-native-ocr')

	writeUtf8(
		packageJsonPath,
		JSON.stringify(
			{
				name: 'electron-bundle-smoke',
				private: true,
				main: 'main.js'
			},
			null,
			2
		)
	)

	writeUtf8(
		mainPath,
		[
			"const assert = require('assert')",
			"const fs = require('fs')",
			"const {app} = require('electron')",
			"const {recognize} = require('node-native-ocr')",
			'',
			`const fixturePath = ${JSON.stringify(FixturePath)}`,
			'',
			'app.whenReady().then(async () => {',
			'  try {',
			`    const text = await recognize(fs.readFileSync(fixturePath), {lang: 'eng', tessdataPath: ${JSON.stringify(TessdataPath)}, requireNonEmpty: true})`,
			"    assert.strictEqual(typeof text, 'string')",
			"    assert.ok(text.length > 0)",
			"    process.stdout.write('Electron bundled-layout smoke test passed\\n')",
			'    app.exit(0)',
			'  } catch (error) {',
			'    console.error(error)',
			'    app.exit(1)',
			'  }',
			'})',
			''
		].join('\n')
	)

	createNodeModuleLink(linkedModulePath, RepoRoot)

	const result = run(
		NpxExecutable,
		['-y', `electron@${ElectronVersion}`, '.'],
		{
			cwd: AppRoot,
			shell: process.platform === 'win32',
			env: getSpawnEnv()
		}
	)

	assertOk(result, 'Electron bundled-layout smoke test')
	process.stdout.write(result.stdout || '')
}

function main() {
	assert.ok(fs.existsSync(FixturePath), `Missing fixture image at ${FixturePath}`)
	try {
		runDirectElectronSmoke()
		runBundledLayoutSmoke()
		console.log(`Electron smoke checks passed for electron@${ElectronVersion}.`)
	} finally {
		fs.rmSync(TempRoot, {recursive: true, force: true})
	}
}

main()
