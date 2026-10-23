#!/usr/bin/env node
// Detects whether axe-core/@axe-core/cli or lighthouse are available for this
// project. Never installs or runs anything — detection only. Prints JSON to
// stdout so the calling agent can decide what to do next.
//
// Usage: node check-audit-tools.js [projectDir]   (defaults to cwd)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = process.argv[2] || process.cwd();

function readPackageJsonDeps(dir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    return Object.assign({}, pkg.dependencies, pkg.devDependencies);
  } catch {
    return {};
  }
}

function hasLocalBin(dir, binName) {
  const binPath = path.join(dir, 'node_modules', '.bin', process.platform === 'win32' ? `${binName}.cmd` : binName);
  return fs.existsSync(binPath);
}

function hasGlobalCommand(cmd) {
  try {
    const checker = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${checker} ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function detect(toolName, packageNames, binName) {
  const deps = readPackageJsonDeps(projectDir);
  const inPackageJson = packageNames.some((name) => deps[name]);
  const localBin = hasLocalBin(projectDir, binName);
  const globalBin = hasGlobalCommand(binName);

  const available = inPackageJson || localBin || globalBin;
  let source = null;
  if (inPackageJson) source = 'package.json dependency';
  else if (localBin) source = 'local node_modules/.bin';
  else if (globalBin) source = 'global install';

  return { tool: toolName, available, source };
}

const results = {
  axeCore: detect('axe-core', ['axe-core', '@axe-core/cli'], 'axe'),
  lighthouse: detect('lighthouse', ['lighthouse'], 'lighthouse'),
};

console.log(JSON.stringify(results, null, 2));
