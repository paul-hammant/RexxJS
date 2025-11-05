/*!
 * System Capabilities Detection
 * Provides canonical functions to check for system capabilities
 * Copyright (c) 2025 Paul Hammant | MIT License
 */

const { execSync } = require('child_process');

/**
 * Cache for capability checks to avoid repeated system calls
 */
const capabilityCache = new Map();

/**
 * Check if a command exists on the system
 */
function hasCommand(command) {
  const cacheKey = `command:${command}`;

  if (capabilityCache.has(cacheKey)) {
    return capabilityCache.get(cacheKey);
  }

  try {
    // Use 'which' on Unix-like systems, 'where' on Windows
    const checkCmd = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${checkCmd} ${command}`, { stdio: 'ignore' });
    capabilityCache.set(cacheKey, true);
    return true;
  } catch (error) {
    capabilityCache.set(cacheKey, false);
    return false;
  }
}

/**
 * Check if Docker is available
 */
function hasDocker() {
  const cacheKey = 'docker:available';

  if (capabilityCache.has(cacheKey)) {
    return capabilityCache.get(cacheKey);
  }

  if (!hasCommand('docker')) {
    capabilityCache.set(cacheKey, false);
    return false;
  }

  try {
    // Verify Docker daemon is running
    execSync('docker info', { stdio: 'ignore', timeout: 2000 });
    capabilityCache.set(cacheKey, true);
    return true;
  } catch (error) {
    capabilityCache.set(cacheKey, false);
    return false;
  }
}

/**
 * Check if Podman is available
 */
function hasPodman() {
  const cacheKey = 'podman:available';

  if (capabilityCache.has(cacheKey)) {
    return capabilityCache.get(cacheKey);
  }

  if (!hasCommand('podman')) {
    capabilityCache.set(cacheKey, false);
    return false;
  }

  try {
    // Verify Podman is working
    execSync('podman info', { stdio: 'ignore', timeout: 2000 });
    capabilityCache.set(cacheKey, true);
    return true;
  } catch (error) {
    capabilityCache.set(cacheKey, false);
    return false;
  }
}

/**
 * Check if QEMU/KVM is available
 */
function hasQemu() {
  const cacheKey = 'qemu:available';

  if (capabilityCache.has(cacheKey)) {
    return capabilityCache.get(cacheKey);
  }

  const result = hasCommand('qemu-system-x86_64') || hasCommand('qemu-img');
  capabilityCache.set(cacheKey, result);
  return result;
}

/**
 * Check if VirtualBox is available
 */
function hasVirtualBox() {
  const cacheKey = 'virtualbox:available';

  if (capabilityCache.has(cacheKey)) {
    return capabilityCache.get(cacheKey);
  }

  const result = hasCommand('VBoxManage') || hasCommand('vboxmanage');
  capabilityCache.set(cacheKey, result);
  return result;
}

/**
 * Check if systemd-nspawn is available
 */
function hasNspawn() {
  const cacheKey = 'nspawn:available';

  if (capabilityCache.has(cacheKey)) {
    return capabilityCache.get(cacheKey);
  }

  const result = hasCommand('systemd-nspawn');
  capabilityCache.set(cacheKey, result);
  return result;
}

/**
 * Check if git is available
 */
function hasGit() {
  return hasCommand('git');
}

/**
 * Check if npm is available
 */
function hasNpm() {
  return hasCommand('npm');
}

/**
 * Check if curl is available
 */
function hasCurl() {
  return hasCommand('curl');
}

/**
 * Check if wget is available
 */
function hasWget() {
  return hasCommand('wget');
}

/**
 * Check if ssh is available
 */
function hasSsh() {
  return hasCommand('ssh');
}

/**
 * Check if a specific capability is available
 * This is the main function used by the test runner
 */
function checkCapability(capability) {
  const normalizedCap = capability.toLowerCase().trim();

  switch (normalizedCap) {
    case 'docker':
      return hasDocker();
    case 'podman':
      return hasPodman();
    case 'qemu':
    case 'kvm':
      return hasQemu();
    case 'virtualbox':
    case 'vbox':
      return hasVirtualBox();
    case 'nspawn':
    case 'systemd-nspawn':
      return hasNspawn();
    case 'git':
      return hasGit();
    case 'npm':
      return hasNpm();
    case 'curl':
      return hasCurl();
    case 'wget':
      return hasWget();
    case 'ssh':
      return hasSsh();
    default:
      // Unknown capability - assume not available
      return false;
  }
}

/**
 * Get all available capabilities
 */
function getAvailableCapabilities() {
  const capabilities = [
    'docker', 'podman', 'qemu', 'virtualbox', 'nspawn',
    'git', 'npm', 'curl', 'wget', 'ssh'
  ];

  return capabilities.filter(cap => checkCapability(cap));
}

/**
 * Clear the capability cache (useful for testing)
 */
function clearCache() {
  capabilityCache.clear();
}

module.exports = {
  hasCommand,
  hasDocker,
  hasPodman,
  hasQemu,
  hasVirtualBox,
  hasNspawn,
  hasGit,
  hasNpm,
  hasCurl,
  hasWget,
  hasSsh,
  checkCapability,
  getAvailableCapabilities,
  clearCache
};
