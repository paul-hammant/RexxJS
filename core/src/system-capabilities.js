/*!
 * System Capabilities Detection - Open/Extensible System
 * Provides simple, generic capability checking without hard-coded technologies
 * Copyright (c) 2025 Paul Hammant | MIT License
 */

const { execSync } = require('child_process');

/**
 * Cache for capability checks to avoid repeated system calls
 */
const capabilityCache = new Map();

/**
 * Check if a command exists on the system
 * This is the default capability check - just checks command existence
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
 * Check if a capability is available
 *
 * This is an OPEN system:
 * - Default: Checks if a command with that name exists (via which/where)
 * - Extensible: Can be customized by defining HAS_<capability>() functions
 *
 * Examples:
 *   @requires docker   → checks if 'docker' command exists
 *   @requires podman   → checks if 'podman' command exists
 *   @requires doofus   → checks if 'doofus' command exists
 *   @requires anything → checks if 'anything' command exists
 *
 * For custom logic, define HAS_DOCKER(), HAS_PODMAN(), etc. functions
 * in your test file or a shared library.
 */
function checkCapability(capability, customCheckers = {}) {
  const normalizedCap = capability.toLowerCase().trim();
  const cacheKey = `capability:${normalizedCap}`;

  // Check cache first
  if (capabilityCache.has(cacheKey)) {
    return capabilityCache.get(cacheKey);
  }

  // Check if there's a custom checker function
  const checkerName = `HAS_${normalizedCap.toUpperCase()}`;
  if (customCheckers[checkerName]) {
    const result = customCheckers[checkerName]();
    capabilityCache.set(cacheKey, result);
    return result;
  }

  // Default behavior: check if command exists
  // This works for: docker, podman, git, npm, curl, wget, ssh, doofus, anything
  const result = hasCommand(normalizedCap);
  capabilityCache.set(cacheKey, result);
  return result;
}

/**
 * Clear the capability cache (useful for testing)
 */
function clearCache() {
  capabilityCache.clear();
}

module.exports = {
  hasCommand,
  checkCapability,
  clearCache
};
