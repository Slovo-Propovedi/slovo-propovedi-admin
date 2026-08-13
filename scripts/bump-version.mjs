#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

const log = (message, color = '') => console.log(`${color}${message}${RESET}`)

const exitError = (message) => {
  log(message, RED)
  process.exit(1)
}

const run = (command) => execSync(command, { stdio: 'inherit' })

// --- Guard: version argument is required ---
const versionArg = process.argv[2]
if (!versionArg) {
  exitError('Usage: npm run bump-version <version|patch|minor|major>')
}

// --- Parse the argument at the boundary: strip optional "v", validate the shape ---
const version = versionArg.startsWith('v') ? versionArg.slice(1) : versionArg
if (!/^\d+\.\d+\.\d+$/.test(version) && !['patch', 'minor', 'major'].includes(version)) {
  exitError(`Invalid argument "${versionArg}". Use X.Y.Z, patch, minor, or major.`)
}

// --- Guard: the working tree must be clean before rewriting version files ---
const dirtyTree = execSync('git status --porcelain', { encoding: 'utf-8' }).trim()
if (dirtyTree) {
  exitError('Working tree is not clean. Commit or stash changes before bumping the version.')
}

// --- Read the current version from package.json (parse at the boundary) ---
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
const currentVersion = pkg.version

// --- Compute the new version ---
const bumpStep = (step) => {
  const [major, minor, patch] = currentVersion.split('.').map(Number)
  return { patch: `${major}.${minor}.${patch + 1}`, minor: `${major}.${minor + 1}.0`, major: `${major + 1}.0.0` }[step]
}
const newVersion = /^\d+\.\d+\.\d+$/.test(version) ? version : bumpStep(version)

// --- Guard: never "bump" to the version already in place ---
if (newVersion === currentVersion) {
  exitError(`Version ${newVersion} is already the current version. Pick a higher version.`)
}

// --- Guard: the new version must not already exist in the changelog ---
const changelogPath = 'CHANGELOG.md'
const changelog = readFileSync(changelogPath, 'utf-8')
if (changelog.includes(`## [${newVersion}]`)) {
  exitError(`Version ${newVersion} already exists in CHANGELOG.md.`)
}

// --- Guard: a [Unreleased] section must exist to promote ---
const unreleased = changelog.match(/^## \[Unreleased\]$/m)
if (!unreleased) {
  exitError('CHANGELOG.md has no "## [Unreleased]" section to promote. Add one and fill it with the upcoming changes.')
}

// --- Update package.json ---
pkg.version = newVersion
writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`)
log('✓ Updated package.json', GREEN)

// --- Update CHANGELOG.md: promote [Unreleased] to the new version, open a fresh empty [Unreleased] ---
const date = new Date().toISOString().slice(0, 10)
const head = changelog.slice(0, unreleased.index)
const tail = changelog.slice(unreleased.index + unreleased[0].length)
const updatedChangelog = `${head}## [Unreleased]\n\n## [${newVersion}] - ${date}${tail}`
writeFileSync(changelogPath, updatedChangelog)
log(`✓ Updated CHANGELOG.md: [Unreleased] → [${newVersion}] - ${date}`, GREEN)

// --- Git operations ---
log('\n→ Staging all changes...', YELLOW)
run('git add -A')

log('→ Committing...', YELLOW)
run(`git commit -s -m "chore: bump version to ${newVersion}"`)

log('→ Tagging...', YELLOW)
run(`git tag -a v${newVersion} -m "v${newVersion}"`)

// Verify the tag actually landed: `git tag -a` has been observed to exit 0
// without an error yet leave the ref missing.
try {
  execSync(`git rev-parse --verify -q v${newVersion}`)
} catch {
  exitError(`Tag v${newVersion} was not created despite 'git tag' reporting success. Run 'git tag -a v${newVersion} -m "v${newVersion}"' manually and verify with 'git tag -l'.`)
}

log('→ Pushing tag...', YELLOW)
try {
  run(`git push origin v${newVersion}`)
} catch {
  exitError(`Tag v${newVersion} was created locally but the push failed. Push it manually: git push origin v${newVersion}`)
}

// --- Summary ---
log('\n══════════════════════════════════════', GREEN)
log('  Version bump complete!', GREEN)
log(`  ${currentVersion} → ${newVersion}`, GREEN)
log(`  Tag: v${newVersion} (pushed)`, GREEN)
log('══════════════════════════════════════', GREEN)
log('  Reminder:  git push origin main', YELLOW)
log('══════════════════════════════════════\n', GREEN)
