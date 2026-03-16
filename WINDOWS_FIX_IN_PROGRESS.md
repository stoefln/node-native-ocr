# WINDOWS_FIX_IN_PROGRESS

## Goal
Stabilize `node-native-ocr` in Electron on GitHub Actions Windows runners and keep iterating until CI is green for the Windows path.

## Current Status
- Timestamp: `2026-03-16 08:31:59 UTC`
- Branch: `main`
- Remote: `origin https://github.com/stoefln/node-native-ocr.git`
- Scope is intentionally narrowed to Windows-only CI while fixing Electron runtime issues.

## Working Rules For Next Agent
- Keep CI scoped to Windows until runtime is stable.
- Always push small focused commits.
- After each push, inspect the latest failing run with `gh` and apply a minimal fix.
- Record each iteration in this file and in `RUNNER-FIX-HISTORY.md`.

## Changes Applied In This Iteration

### 1. Restrict CI to Windows only
- File: `.github/workflows/ci.yaml`
- Change:
  - Matrix changed from multi-OS to `os: [ windows-latest ]`.
- Reason:
  - Reduce noise and speed up debugging for the known failing environment.

### 2. Ensure Electron compatibility check runs on Windows
- File: `.github/workflows/ci.yaml`
- Change:
  - `Verify required Electron target compatibility` now runs when `runner.os == 'Windows'`.
- Reason:
  - Keep an explicit gate that the configured Electron version reports a compatible N-API level.

### 3. Keep Windows tests active
- File: `.github/workflows/ci.yaml`
- Change:
  - `npm test` remains enabled on Windows.
- Reason:
  - Requirement is to test Windows runtime behavior, not just build.

### 4. Add explicit Electron smoke tests to CI
- Files:
  - `.github/workflows/ci.yaml`
  - `package.json`
  - `scripts/electron-smoke.js`
- Changes:
  - Added step `Run Electron smoke tests`:
    - `npm run test-electron -- "${{ env.REQUIRED_ELECTRON_VERSION }}"`
  - Added npm script:
    - `"test-electron": "node ./scripts/electron-smoke.js"`
  - Added new script `scripts/electron-smoke.js` with two checks:
    - Direct Electron main-process OCR smoke execution (`electron -e`).
    - Bundled-layout simulation using a temporary `temp/electron-bundle-smoke/resources/app` app root and `node_modules/node-native-ocr` link.
  - Temp smoke folder is cleaned in a `finally` block.
- Reason:
  - Validate both direct Electron runtime and app-like module resolution layout.

## Validation Done Locally
- Command:
  - `node --check scripts/electron-smoke.js`
- Result:
  - Syntax check passed.

## Pending Actions
- Commit and push the Windows `spawnSync` env sanitization fix.
- Observe the next `Run CI` workflow on GitHub Actions.
- If failing, inspect logs and apply the smallest targeted fix.

## Iteration Procedure (Do Not Skip)
1. Push current changes.
2. Wait for `Run CI` run completion.
3. Inspect failures:
   - `gh run list --workflow "Run CI" --limit 5`
   - `gh run view <run-id> --log-failed`
4. Derive root cause from first failing Windows step.
5. Apply minimal fix.
6. Re-run local static checks where possible.
7. Commit and push.
8. Append new entry to this file and `RUNNER-FIX-HISTORY.md`.

## Command Snippets
```bash
git status --short
git add .github/workflows/ci.yaml package.json scripts/electron-smoke.js WINDOWS_FIX_IN_PROGRESS.md
git commit -m "Add Windows Electron smoke CI flow and handoff log"
git push origin main

gh run list --workflow "Run CI" --limit 5
gh run view <run-id>
gh run view <run-id> --log-failed
```

## Iteration Log

### Iteration W (completed)
- Introduced Windows-only CI focus.
- Added required Electron target verification on Windows.
- Added `test-electron` script and CI step.
- Added bundled-layout Electron smoke test helper script.
- Created this handoff document.
- Commit: `fd73349`
- Run observed: `23134345761` (`Run CI`)
- Outcome: failed at `Verify required Electron target compatibility`.

### Iteration X (completed)
- Failing run: `23134345761`
- First failing step:
  - `Verify required Electron target compatibility`
- Root cause from log:
  - `Error: Failed to spawn Electron 40.8.0 probe: spawnSync npx.cmd EINVAL`
  - This is consistent with Windows pseudo environment variables (keys like `=C:`) causing `spawnSync` failure when `env` is passed explicitly.
- Current local fix:
  - `scripts/verify-electron-target.js`
    - added `getSpawnEnv()` to filter pseudo env keys on Windows before spawning `npx.cmd`.
  - `scripts/electron-smoke.js`
    - added matching `getSpawnEnv()` and switched both Electron spawn calls to use sanitized env.
  - local validation:
    - `node --check scripts/verify-electron-target.js`
    - `node --check scripts/electron-smoke.js`

### Iteration Y (current, in progress)
- Failing run: `23134690070`
- First failing step:
  - `Verify required Electron target compatibility`
- Root cause from log:
  - Same failure persisted: `spawnSync npx.cmd EINVAL`.
  - Stronger hypothesis: Windows command shim execution (`.cmd`) via `spawnSync` without shell is the blocker.
- Current local fix:
  - `scripts/verify-electron-target.js`
    - switched executable from `npx.cmd` to `npx`.
    - enabled `shell: process.platform === 'win32'` for spawn call.
  - `scripts/electron-smoke.js`
    - switched executable from `npx.cmd` to `npx`.
    - enabled `shell: process.platform === 'win32'` for both Electron spawn calls.
  - local validation:
    - `node --check scripts/verify-electron-target.js`
    - `node --check scripts/electron-smoke.js`

### Iteration Z (completed)
- Optimization request:
  - `Build native dependencies` is the slowest CI step (about 6+ minutes), so cache outputs while debugging runtime issues.
- Current local fix:
  - `.github/workflows/ci.yaml`
    - added `NATIVE_DEPS_CACHE_VERSION` env key for manual cache busting.
    - added `actions/cache@v4` restore step for:
      - `tesseract/build`
      - `leptonica/build`
      - `libtiff/build`
      - `libpng/build`
      - `libjpeg/build`
      - `zlib/build`
    - cache key includes:
      - OS, arch, node version
      - `NATIVE_DEPS_CACHE_VERSION`
      - `hashFiles('scripts/build-tesseract.js', 'scripts/clean-tesseract.js', 'patches/**')`
    - `Build native dependencies` now runs only on cache miss.
    - added explicit cache-hit/cache-miss status logging step.
- How to force rebuild:
  - bump `NATIVE_DEPS_CACHE_VERSION` (for example `v1` -> `v2`).

### Iteration AA (current, in progress)
- Failing run: `23135081029`
- First failing step:
  - `Verify required Electron target compatibility`
- Root cause from log:
  - `SyntaxError: Unexpected end of input`
  - `'null' is not recognized as an internal or external command`
  - This indicates Windows shell quoting broke inline `-e` JavaScript passed to Electron.
- Current local fix:
  - `scripts/verify-electron-target.js`
    - replaced inline `-e` probe code with a temporary probe script file under `temp/electron-target-verify`.
    - execute Electron against probe file path.
  - `scripts/electron-smoke.js`
    - replaced direct smoke `-e` invocation with temporary file-based probe script under `temp/electron-bundle-smoke/direct-probe`.
  - local validation:
    - `node --check scripts/verify-electron-target.js`
    - `node --check scripts/electron-smoke.js`