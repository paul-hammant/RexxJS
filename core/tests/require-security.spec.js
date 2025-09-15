/**
 * REQUIRE Security and Sandboxing Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');

describe('REQUIRE Security and Sandboxing', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new RexxInterpreter();
  });
  
  test('should initialize with default security policy', () => {
    expect(interpreter.securityPolicy).toBe('default');
    expect(interpreter.approvedLibraries).toBeInstanceOf(Set);
    expect(interpreter.pendingPermissionRequests).toBeInstanceOf(Map);
  });
  
  test('should validate security policy settings', () => {
    const validPolicies = ['strict', 'moderate', 'default', 'permissive'];
    
    // Test valid policies
    for (const policy of validPolicies) {
      expect(() => interpreter.setSecurityPolicy(policy)).not.toThrow();
      expect(interpreter.securityPolicy).toBe(policy);
    }
    
    // Test invalid policy
    expect(() => interpreter.setSecurityPolicy('invalid')).toThrow('Invalid security policy');
  });
  
  test('should assess risk levels correctly', () => {
    expect(interpreter.assessRiskLevel('central:alice/math-utils@v1.0.0')).toBe('low');
    expect(interpreter.assessRiskLevel('github.com/microsoft/typescript@v4.0.0')).toBe('low');
    expect(interpreter.assessRiskLevel('github.com/randomuser/suspicious-lib@v1.0.0')).toBe('medium');
    expect(interpreter.assessRiskLevel('unknown-source')).toBe('high');
  });
  
  test('should validate GitHub library format', async () => {
    // Valid formats should pass
    await expect(interpreter.validateGitHubLibrary('github.com/alice/math-utils@v1.0.0')).resolves.toBe(true);
    await expect(interpreter.validateGitHubLibrary('github.com/microsoft/typescript')).resolves.toBe(true);
    
    // Invalid formats should fail
    await expect(interpreter.validateGitHubLibrary('invalid-library-name')).rejects.toThrow('Invalid GitHub library format');
    await expect(interpreter.validateGitHubLibrary('github.com/invalid$name/lib')).rejects.toThrow('Invalid GitHub library format');
  });
  
  test('should create sandbox with proper restrictions', () => {
    const libraryName = 'github.com/test/sandbox-lib';
    const sandbox = interpreter.createSandbox(libraryName);
    
    // Dangerous globals should be blocked
    const dangerousGlobals = ['eval', 'Function', 'require', 'process', 'global', 'window'];
    dangerousGlobals.forEach(prop => {
      expect(sandbox[prop]).toBeUndefined();
    });
    
    // Safe globals should be available
    const safeGlobals = ['Math', 'JSON', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean'];
    safeGlobals.forEach(prop => {
      expect(sandbox[prop]).toBeDefined();
    });
    
    // Library namespace should be created
    const namespace = interpreter.getThirdPartyNamespace('sandbox-lib');
    expect(sandbox[namespace]).toBeDefined();
    expect(typeof sandbox[namespace]).toBe('object');
  });
  
  test('should validate sandbox integrity', () => {
    const libraryName = 'github.com/test/integrity-lib';
    const sandbox = interpreter.createSandbox(libraryName);
    
    // Sandbox should pass integrity check initially
    expect(() => interpreter.validateSandboxIntegrity(sandbox, libraryName)).not.toThrow();
    
    // Sandbox should fail if dangerous props are added
    sandbox.eval = function() {};
    expect(() => interpreter.validateSandboxIntegrity(sandbox, libraryName)).toThrow('Sandbox integrity violation');
  });
  
  test('should handle Node.js permissions correctly', async () => {
    // Mock Node.js environment
    const originalProcess = global.process;
    global.process = { versions: { node: '16.0.0' } };
    
    try {
      // Local modules should be allowed
      const result1 = await interpreter.checkNodeJSPermissions('./test-module', 'local');
      expect(result1).toBe(true);
      
      // npm modules should be allowed
      const result2 = await interpreter.checkNodeJSPermissions('lodash', 'npm');
      expect(result2).toBe(true);
      
      // Central registry libraries should be allowed
      const result3 = await interpreter.checkNodeJSPermissions('central:alice/math@v1.0.0', 'module');
      expect(result3).toBe(true);
      
      // GitHub libraries should require validation
      await expect(interpreter.checkNodeJSPermissions('github.com/alice/math@v1.0.0', 'module')).resolves.toBe(true);
      
    } finally {
      global.process = originalProcess;
    }
  });
  
  test('should handle web permissions with different policies', async () => {
    // Mock browser environment
    const originalWindow = global.window;
    global.window = {};
    
    try {
      // Test strict policy
      interpreter.setSecurityPolicy('strict');
      
      // Central registry should be allowed
      await expect(interpreter.checkWebPermissions('central:alice/math@v1.0.0', 'module')).resolves.toBe(true);
      
      // Built-ins should be allowed
      await expect(interpreter.checkWebPermissions('r-math-functions', 'builtin')).resolves.toBe(true);
      
      // GitHub direct should be blocked
      await expect(interpreter.checkWebPermissions('github.com/alice/math@v1.0.0', 'module'))
        .rejects.toThrow('blocked by strict security policy');
      
      // Test moderate policy
      interpreter.setSecurityPolicy('moderate');
      await expect(interpreter.checkWebPermissions('github.com/alice/math@v1.0.0', 'module')).resolves.toBe(true);
      
      // Test permissive policy
      interpreter.setSecurityPolicy('permissive');
      await expect(interpreter.checkWebPermissions('github.com/alice/math@v1.0.0', 'module')).resolves.toBe(true);
      
    } finally {
      global.window = originalWindow;
    }
  });
  
  test('should handle blocked repositories', async () => {
    // Mock a blocked repository
    const originalGetBlockedRepositories = interpreter.getBlockedRepositories;
    interpreter.getBlockedRepositories = () => ['malicious/evil-lib'];
    
    try {
      await expect(interpreter.validateGitHubLibrary('github.com/malicious/evil-lib@v1.0.0'))
        .rejects.toThrow('is on security blocklist');
    } finally {
      interpreter.getBlockedRepositories = originalGetBlockedRepositories;
    }
  });
  
  test('should generate library metadata correctly', () => {
    const metadata1 = interpreter.getLibraryMetadata('central:alice/math@v1.0.0');
    expect(metadata1.source).toBe('central-registry');
    expect(metadata1.riskLevel).toBe('low');
    
    const metadata2 = interpreter.getLibraryMetadata('github.com/microsoft/typescript@v1.0.0');
    expect(metadata2.source).toBe('github-direct');
    expect(metadata2.riskLevel).toBe('low');
    
    const metadata3 = interpreter.getLibraryMetadata('github.com/unknown/lib@v1.0.0');
    expect(metadata3.source).toBe('github-direct');
    expect(metadata3.riskLevel).toBe('medium');
  });
  
  test('should handle permission responses correctly', () => {
    // Set up a mock permission request
    const requestId = 'test_123';
    const libraryName = 'github.com/test/lib@v1.0.0';
    
    let resolveValue = null;
    let rejectReason = null;
    
    const mockRequest = {
      resolve: (value) => { resolveValue = value; },
      reject: (reason) => { rejectReason = reason; },
      timeoutId: setTimeout(() => {}, 1000)
    };
    
    interpreter.pendingPermissionRequests.set(requestId, mockRequest);
    
    // Test approval
    interpreter.handleLibraryPermissionResponse({
      requestId: requestId,
      approved: true,
      libraryName: libraryName
    });
    
    expect(resolveValue).toBe(true);
    expect(interpreter.approvedLibraries.has(libraryName)).toBe(true);
    expect(interpreter.pendingPermissionRequests.has(requestId)).toBe(false);
    
    // Reset for denial test
    resolveValue = null;
    rejectReason = null;
    interpreter.pendingPermissionRequests.set(requestId, mockRequest);
    
    // Test denial
    interpreter.handleLibraryPermissionResponse({
      requestId: requestId,
      approved: false,
      libraryName: libraryName,
      reason: 'Security policy violation'
    });
    
    expect(rejectReason).toBeDefined();
    expect(rejectReason.message).toContain('Security policy violation');
    expect(interpreter.pendingPermissionRequests.has(requestId)).toBe(false);
  });
});