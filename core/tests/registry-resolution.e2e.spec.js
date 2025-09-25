/**
 * Registry Resolution End-to-End Tests
 * Tests the complete flow from namespace/module@version to final URL resolution
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');

describe('Registry Resolution System', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new TestRexxInterpreter();
  });

  describe('Registry Library Name Parsing', () => {
    test('should parse namespace/module format', () => {
      const parsed = interpreter.parseRegistryLibraryName('rexxjs/sqlite3-address');
      expect(parsed).toEqual({
        namespace: 'rexxjs',
        module: 'sqlite3-address',
        version: 'latest'
      });
    });

    test('should parse namespace/module@version format', () => {
      const parsed = interpreter.parseRegistryLibraryName('rexxjs/sqlite3-address@v1.0.0');
      expect(parsed).toEqual({
        namespace: 'rexxjs',
        module: 'sqlite3-address',
        version: 'v1.0.0'
      });
    });

    test('should parse complex namespace format', () => {
      const parsed = interpreter.parseRegistryLibraryName('com.example/my-lib@latest');
      expect(parsed).toEqual({
        namespace: 'com.example',
        module: 'my-lib',
        version: 'latest'
      });
    });

    test('should throw error for invalid format', () => {
      expect(() => {
        interpreter.parseRegistryLibraryName('invalid-format');
      }).toThrow('Invalid registry library name format');
    });
  });

  describe('Registry Style Detection', () => {
    test('should detect registry style libraries', () => {
      expect(interpreter.isRegistryStyleLibrary('rexxjs/sqlite3-address')).toBe(true);
      expect(interpreter.isRegistryStyleLibrary('rexxjs/sqlite3-address@latest')).toBe(true);
      expect(interpreter.isRegistryStyleLibrary('com.example/my-lib@v1.0.0')).toBe(true);
      expect(interpreter.isRegistryStyleLibrary('org.test/module-name')).toBe(true);
    });

    test('should not detect non-registry formats', () => {
      expect(interpreter.isRegistryStyleLibrary('./local/file.js')).toBe(false);
      expect(interpreter.isRegistryStyleLibrary('../relative/path.js')).toBe(false);
      expect(interpreter.isRegistryStyleLibrary('https://example.com/lib.js')).toBe(false);
      expect(interpreter.isRegistryStyleLibrary('github.com/user/repo')).toBe(false);
      expect(interpreter.isRegistryStyleLibrary('simple-npm-package')).toBe(false);
    });
  });

  describe('Publisher Registry Lookup', () => {
    test('should lookup known publisher', async () => {
      // Mock fetch for publisher registry
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`namespace,registry_url
rexxjs,https://raw.githubusercontent.com/RexxJS/dist/latest/registry.txt
com.example,https://example.com/registry.txt`)
        });

      const registryUrl = await interpreter.lookupPublisherRegistry('rexxjs');
      expect(registryUrl).toBe('https://raw.githubusercontent.com/RexxJS/dist/latest/registry.txt');
    });

    test('should handle unknown publisher', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`namespace,registry_url
rexxjs,https://raw.githubusercontent.com/RexxJS/dist/latest/registry.txt`)
        });

      await expect(interpreter.lookupPublisherRegistry('unknown'))
        .rejects.toThrow("Namespace 'unknown' not found in publisher registry");
    });

    test('should handle network errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        });

      await expect(interpreter.lookupPublisherRegistry('rexxjs'))
        .rejects.toThrow('Failed to fetch publisher registry: 404');
    });
  });

  describe('Module Registry Lookup', () => {
    test('should lookup known module', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`# RexxJS Module Registry
sqlite3-address,address-handler,https://raw.githubusercontent.com/RexxJS/dist/{tag}/addresses/sqlite-address.bundle.js
math-functions,function-library,https://raw.githubusercontent.com/RexxJS/dist/{tag}/functions/math-functions.bundle.js`)
        });

      const moduleUrl = await interpreter.lookupModuleInRegistry(
        'https://raw.githubusercontent.com/RexxJS/dist/latest/registry.txt',
        'sqlite3-address',
        'latest'
      );
      
      expect(moduleUrl).toBe('https://raw.githubusercontent.com/RexxJS/dist/latest/addresses/sqlite-address.bundle.js');
    });

    test('should substitute version tag correctly', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`sqlite3-address,address-handler,https://raw.githubusercontent.com/RexxJS/dist/{tag}/addresses/sqlite-address.bundle.js`)
        });

      const moduleUrl = await interpreter.lookupModuleInRegistry(
        'https://registry.example.com/modules.txt',
        'sqlite3-address',
        'v1.0.0'
      );
      
      expect(moduleUrl).toBe('https://raw.githubusercontent.com/RexxJS/dist/v1.0.0/addresses/sqlite-address.bundle.js');
    });

    test('should handle unknown module', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`sqlite3-address,address-handler,https://example.com/{tag}/sqlite3.js`)
        });

      await expect(interpreter.lookupModuleInRegistry(
        'https://registry.example.com/modules.txt',
        'unknown-module',
        'latest'
      )).rejects.toThrow("Module 'unknown-module' not found in registry");
    });
  });

  describe('Full Registry Resolution Flow', () => {
    test('should resolve complete registry flow', async () => {
      // Mock the multi-step resolution
      global.fetch = jest.fn()
        // Step 1: Publisher registry lookup
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`namespace,registry_url
rexxjs,https://raw.githubusercontent.com/RexxJS/dist/latest/registry.txt`)
        })
        // Step 2: Module registry lookup  
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`sqlite3-address,address-handler,https://raw.githubusercontent.com/RexxJS/dist/{tag}/addresses/sqlite-address.bundle.js`)
        })
        // Step 3: Final module download (mocked as successful)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('/* mock module code */')
        });

      // Mock the final requireRemoteLibrary call
      interpreter.requireRemoteLibrary = jest.fn().mockResolvedValue(true);

      const result = await interpreter.requireRegistryStyleLibrary('rexxjs/sqlite3-address@latest');
      
      expect(result).toBe(true);
      expect(interpreter.requireRemoteLibrary).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/RexxJS/dist/latest/addresses/sqlite-address.bundle.js'
      );
    });

    test('should handle registry resolution errors gracefully', async () => {
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(interpreter.requireRegistryStyleLibrary('rexxjs/sqlite3-address'))
        .rejects.toThrow('Registry resolution failed for rexxjs/sqlite3-address: Publisher registry lookup failed: Network error');
    });
  });

  describe('Integration with Main REQUIRE Flow', () => {
    test('should detect registry style and route correctly', async () => {
      // Mock the registry resolution completely to avoid HTTP calls
      interpreter.requireRegistryStyleLibrary = jest.fn().mockResolvedValue(true);
      interpreter.isLocalOrNpmModule = jest.fn().mockReturnValue(false);
      interpreter.isRegistryStyleLibrary = jest.fn().mockReturnValue(true);
      interpreter.fetchLibraryCode = jest.fn().mockResolvedValue('/* mock library code */');
      interpreter.isLibraryLoaded = jest.fn().mockReturnValue(true);

      const result = await interpreter.requireNodeJS('rexxjs/sqlite3-address@latest');
      
      expect(result).toBe(true);
      expect(interpreter.requireRegistryStyleLibrary).toHaveBeenCalledWith('rexxjs/sqlite3-address@latest');
    });

    test('should fall back to remote Git platforms for non-registry formats', async () => {
      interpreter.requireRemoteLibrary = jest.fn().mockResolvedValue(true);
      interpreter.isLocalOrNpmModule = jest.fn().mockReturnValue(false);
      interpreter.isRegistryStyleLibrary = jest.fn().mockReturnValue(false);
      interpreter.fetchLibraryCode = jest.fn().mockResolvedValue('/* mock library code */');
      interpreter.isLibraryLoaded = jest.fn().mockReturnValue(true);

      const result = await interpreter.requireNodeJS('github.com/user/repo@v1.0.0');
      
      expect(result).toBe(true);
      expect(interpreter.requireRemoteLibrary).toHaveBeenCalledWith('github.com/user/repo@v1.0.0');
    });
  });

  afterEach(() => {
    // Clean up mocks
    if (global.fetch && global.fetch.mockRestore) {
      global.fetch.mockRestore();
    }
  });
});