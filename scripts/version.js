#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Read package.json
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Get current version
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Get increment type from command line argument
const incrementType = process.argv[2] || 'patch';

let newVersion;
switch (incrementType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`Version bumped from ${currentVersion} to ${newVersion}`);

// Also update the version in the HTML file if it exists
const htmlPath = path.join(process.cwd(), 'index.html');
if (fs.existsSync(htmlPath)) {
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  // Replace version in the format "Version: X.X.X"
  htmlContent = htmlContent.replace(/Version: \d+\.\d+\.\d+/g, `Version: ${newVersion}`);
  fs.writeFileSync(htmlPath, htmlContent);
  console.log('Updated version in index.html');
} 