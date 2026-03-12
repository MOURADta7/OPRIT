#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Emoji helpers
const emoji = {
  rocket: '🚀',
  check: '✅',
  error: '❌',
  warning: '⚠️',
  package: '📦',
  clean: '🧹',
  build: '🔨',
  upload: '⬆️',
  folder: '📁',
  size: '📏',
  info: 'ℹ️',
  star: '⭐',
  sparkles: '✨'
};

function log(message, color = 'reset', icon = '') {
  console.log(`${icon} ${colors[color]}${message}${colors.reset}`);
}

function logStep(step, total, message) {
  console.log(`\n${colors.cyan}${'─'.repeat(50)}${colors.reset}`);
  log(`[${step}/${total}] ${message}`, 'bright', emoji.sparkles);
  console.log(`${colors.cyan}${'─'.repeat(50)}${colors.reset}\n`);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function cleanOldBuilds() {
  const zipPath = path.join(__dirname, 'orbit-extension.zip');

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
    log('Old zip archive removed', 'yellow', emoji.clean);
  } else {
    log('No old build to clean', 'dim', emoji.clean);
  }
}

async function runBuild() {
  const packageJsonPath = path.join(__dirname, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    log('No package.json found, skipping npm build', 'yellow', emoji.warning);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (!packageJson.scripts || !packageJson.scripts.build) {
    log('No build script found in package.json, skipping', 'yellow', emoji.warning);
    return;
  }

  log('Running npm build...', 'blue', emoji.build);

  try {
    execSync('npm run build', {
      stdio: 'inherit',
      cwd: __dirname
    });
    log('Build completed successfully!', 'green', emoji.check);
  } catch (error) {
    log('Build failed!', 'red', emoji.error);
    throw error;
  }
}

function validateManifest() {
  const manifestPath = path.join(__dirname, 'manifest.json');

  log('Validating manifest.json...', 'blue', emoji.info);

  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.json not found in root directory!');
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in manifest.json: ${error.message}`);
  }

  const requiredFields = ['manifest_version', 'name', 'version'];
  const missing = requiredFields.filter(field => !manifest[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required fields in manifest.json: ${missing.join(', ')}`);
  }

  if (manifest.manifest_version !== 3) {
    log(`Warning: manifest_version is ${manifest.manifest_version}, Chrome Web Store prefers version 3`, 'yellow', emoji.warning);
  }

  log(`Manifest valid: ${manifest.name} v${manifest.version}`, 'green', emoji.check);

  return manifest;
}

async function createZip() {
  const zipPath = path.join(__dirname, 'orbit-extension.zip');
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const stats = fs.statSync(zipPath);
      resolve(stats);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        log(`Warning: ${err.message}`, 'yellow', emoji.warning);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);

    // Exclude patterns
    const excludePatterns = [
      'node_modules/**',
      '.git/**',
      '.env',
      '.env.*',
      '**/.gitignore',
      '**/build-and-zip.js',
      '**/package.json',
      '**/package-lock.json',
      '**/orbit-extension.zip',
      '**/*.md',
      '**/test/**',
      '**/tests/**',
      '**/__tests__/**',
      '**/*.test.js',
      '**/*.spec.js',
      '**/coverage/**',
      '**/.vscode/**',
      '**/.idea/**',
      '**/*.log',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*'
    ];

    // Add all files except excluded
    archive.glob('**/*', {
      cwd: __dirname,
      ignore: excludePatterns,
      dot: true
    });

    archive.finalize();
  });
}

function checkSize(stats) {
  const size = stats.size;
  const formatted = formatBytes(size);
  const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB Chrome Web Store limit

  logStep(4, 5, 'Checking Package Size');
  log(`Package size: ${formatted}`, 'cyan', emoji.size);

  if (size > MAX_SIZE) {
    log(`WARNING: Package exceeds Chrome Web Store limit (2GB)!`, 'red', emoji.error);
  } else if (size > MAX_SIZE * 0.9) {
    log(`WARNING: Package is over 90% of size limit`, 'yellow', emoji.warning);
  } else {
    log('Package size is within limits', 'green', emoji.check);
  }

  return formatted;
}

function showUploadSteps() {
  logStep(5, 5, 'Chrome Web Store Upload Steps');

  console.log(`
${colors.cyan}Follow these steps to upload your extension:${colors.reset}

${emoji.upload} ${colors.bright}Step 1:${colors.reset} Go to ${colors.blue}https://chrome.google.com/webstore/devconsole/${colors.reset}

${emoji.upload} ${colors.bright}Step 2:${colors.reset} Sign in with your Google account

${emoji.upload} ${colors.bright}Step 3:${colors.reset} Click "New Item" or select existing item

${emoji.upload} ${colors.bright}Step 4:${colors.reset} Upload the ${colors.yellow}orbit-extension.zip${colors.reset} file

${emoji.upload} ${colors.bright}Step 5:${colors.reset} Fill in store listing details:
   • Description
   • Screenshots (1280x800 or 640x400)
   • Icon (128x128)
   • Category

${emoji.upload} ${colors.bright}Step 6:${colors.reset} Set pricing (Free or Paid)

${emoji.upload} ${colors.bright}Step 7:${colors.reset} Click "Submit for review"

${colors.yellow}⚠️  Note: Review typically takes 1-3 business days${colors.reset}
`);
}

async function main() {
  const startTime = Date.now();

  console.log(`\n${colors.magenta}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}  ${emoji.rocket} ORBIT Extension Build & Package Tool ${emoji.rocket}${colors.reset}`);
  console.log(`${colors.magenta}${'═'.repeat(60)}${colors.reset}\n`);

  try {
    // Step 1: Clean old builds
    logStep(1, 5, 'Cleaning Old Builds');
    await cleanOldBuilds();

    // Step 2: Run npm build
    logStep(2, 5, 'Building Extension');
    await runBuild();

    // Step 3: Validate manifest and create zip
    logStep(3, 5, 'Validating & Packaging');
    const manifest = validateManifest();
    log(`Creating zip archive...`, 'blue', emoji.package);
    const stats = await createZip();

    // Step 4: Check size
    const formattedSize = checkSize(stats);

    // Step 5: Show upload steps
    showUploadSteps();

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n${colors.green}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}  ${emoji.check} SUCCESS! Extension packaged successfully! ${emoji.check}${colors.reset}`);
    console.log(`${colors.green}${'═'.repeat(60)}${colors.reset}\n`);

    console.log(`${emoji.package}  ${colors.cyan}Output:${colors.reset} orbit-extension.zip`);
    console.log(`${emoji.info}  ${colors.cyan}Name:${colors.reset} ${manifest.name}`);
    console.log(`${emoji.info}  ${colors.cyan}Version:${colors.reset} ${manifest.version}`);
    console.log(`${emoji.size}  ${colors.cyan}Size:${colors.reset} ${formattedSize}`);
    console.log(`${emoji.star}  ${colors.cyan}Time:${colors.reset} ${duration}s`);

    console.log(`\n${colors.green}Ready for Chrome Web Store upload!${colors.reset} ${emoji.rocket}\n`);

  } catch (error) {
    console.log(`\n${colors.red}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}  ${emoji.error} BUILD FAILED ${emoji.error}${colors.reset}`);
    console.log(`${colors.red}${'═'.repeat(60)}${colors.reset}\n`);
    console.log(`${colors.red}Error: ${error.message}${colors.reset}\n`);
    process.exit(1);
  }
}

main();
