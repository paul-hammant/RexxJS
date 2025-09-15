/**
 * Interpreter Library URL Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const {
  isLocalOrNpmModule,
  getLibraryType,
  getLibraryRepository,
  getLibraryTag,
  getLibraryPath,
  shouldUseGitHubRelease,
  resolveGitHubRawUrl,
  resolveWebLibraryUrl,
  getLibrarySources,
  shouldTryCDN,
  getCDNSources,
  getGitHubReleaseSources,
} = require('../src/interpreter-library-url');

describe('Interpreter Library URL', () => {
  describe('isLocalOrNpmModule', () => {
    it('should return true for local relative paths starting with ./', () => {
      expect(isLocalOrNpmModule('./my-lib')).toBe(true);
    });

    it('should return true for local relative paths starting with ../', () => {
      expect(isLocalOrNpmModule('../my-lib')).toBe(true);
    });

    it('should return true for npm package names', () => {
      expect(isLocalOrNpmModule('my-npm-package')).toBe(true);
    });

    it('should return false for GitHub URLs', () => {
      expect(isLocalOrNpmModule('github.com/user/repo')).toBe(false);
    });

    it('should return false for http URLs', () => {
      expect(isLocalOrNpmModule('http://example.com/my-lib.js')).toBe(false);
    });

    it('should return false for https URLs', () => {
      expect(isLocalOrNpmModule('https://example.com/my-lib.js')).toBe(false);
    });
  });

  describe('getLibraryType', () => {
    const isBuiltinLibraryFn = (name) => name === 'builtin-lib';

    it('should identify builtin libraries', () => {
      expect(getLibraryType('builtin-lib', isBuiltinLibraryFn)).toBe('builtin');
    });

    it('should identify local libraries starting with ./', () => {
      expect(getLibraryType('./my-lib', isBuiltinLibraryFn)).toBe('local');
    });

    it('should identify local libraries starting with ../', () => {
      expect(getLibraryType('../my-lib', isBuiltinLibraryFn)).toBe('local');
    });

    it('should identify local libraries starting with /', () => {
      expect(getLibraryType('/my-lib', isBuiltinLibraryFn)).toBe('local');
    });

    it('should identify module libraries from github.com', () => {
      expect(getLibraryType('github.com/user/repo', isBuiltinLibraryFn)).toBe('module');
    });

    it('should identify module libraries from gitlab.com', () => {
      expect(getLibraryType('gitlab.com/user/repo', isBuiltinLibraryFn)).toBe('module');
    });

    it('should classify others as third-party', () => {
      expect(getLibraryType('my-random-lib', isBuiltinLibraryFn)).toBe('third-party');
    });
  });

  describe('getLibraryRepository', () => {
    const isBuiltinLibraryFn = (name) => name.startsWith('builtin-lib');

    it('should return the correct repository for builtin libraries', () => {
      expect(getLibraryRepository('builtin-lib', isBuiltinLibraryFn)).toBe('rexxjs/rexxjs');
    });

    it('should extract repository from github module paths', () => {
      expect(getLibraryRepository('github.com/user/repo', isBuiltinLibraryFn)).toBe('user/repo');
    });

    it('should extract repository from gitlab module paths', () => {
      expect(getLibraryRepository('gitlab.com/user/repo', isBuiltinLibraryFn)).toBe('user/repo');
    });

    it('should handle third-party libraries with user/repo format', () => {
      expect(getLibraryRepository('user/repo', isBuiltinLibraryFn)).toBe('user/repo');
    });

    it('should handle third-party libraries without user/repo format', () => {
      expect(getLibraryRepository('my-lib', isBuiltinLibraryFn)).toBe('rexx-libs/my-lib');
    });

    it('should strip version specifiers', () => {
      expect(getLibraryRepository('github.com/user/repo@v1.2.3', isBuiltinLibraryFn)).toBe('user/repo');
      expect(getLibraryRepository('user/repo@v1.2.3', isBuiltinLibraryFn)).toBe('user/repo');
      expect(getLibraryRepository('my-lib@v1.2.3', isBuiltinLibraryFn)).toBe('rexx-libs/my-lib');
    });
  });

  describe('getLibraryTag', () => {
    const isBuiltinLibraryFn = (name) => name === 'builtin-lib';

    it('should extract tag from library name', () => {
      expect(getLibraryTag('my-lib@v1.2.3', isBuiltinLibraryFn)).toBe('v1.2.3');
      expect(getLibraryTag('github.com/user/repo@main', isBuiltinLibraryFn)).toBe('main');
    });

    it('should return default tag for builtin libraries', () => {
      expect(getLibraryTag('builtin-lib', isBuiltinLibraryFn)).toBe('refs/heads/main');
    });

    it('should return default tag for module libraries', () => {
      expect(getLibraryTag('github.com/user/repo', isBuiltinLibraryFn)).toBe('main');
    });

    it('should return default tag for third-party libraries', () => {
      expect(getLibraryTag('my-lib', isBuiltinLibraryFn)).toBe('main');
    });
  });

  describe('getLibraryPath', () => {
    const isBuiltinLibraryFn = (name) => name === 'builtin-lib';

    it('should return correct path for builtin libraries', () => {
      expect(getLibraryPath('builtin-lib', isBuiltinLibraryFn)).toBe('src/builtin-lib.js');
    });

    it('should return correct path for module libraries', () => {
      expect(getLibraryPath('github.com/user/my-module', isBuiltinLibraryFn)).toBe('dist/my-module.js');
    });

    it('should return correct path for third-party libraries', () => {
      expect(getLibraryPath('my-lib', isBuiltinLibraryFn)).toBe('lib/my-lib.js');
    });
  });

  describe('shouldUseGitHubRelease', () => {
    it('should return true for semver tags with v prefix', () => {
      expect(shouldUseGitHubRelease('my-lib', 'v1.2.3')).toBe(true);
    });

    it('should return true for semver tags without v prefix', () => {
      expect(shouldUseGitHubRelease('my-lib', '1.2.3')).toBe(true);
    });

    it('should return false for non-semver tags like "main"', () => {
      expect(shouldUseGitHubRelease('my-lib', 'main')).toBe(false);
    });

    it('should return false for non-semver tags like "latest"', () => {
      expect(shouldUseGitHubRelease('my-lib', 'latest')).toBe(false);
    });
  });

  describe('resolveGitHubRawUrl', () => {
    const isBuiltinLibraryFn = (name) => false;

    it('should resolve a GitHub raw URL for a third-party library', () => {
      const expected = 'https://raw.githubusercontent.com/rexx-libs/my-lib/main/lib/my-lib.js';
      expect(resolveGitHubRawUrl('my-lib', isBuiltinLibraryFn)).toBe(expected);
    });

    it('should resolve a GitHub raw URL for a module library with version', () => {
      const expected = 'https://raw.githubusercontent.com/user/repo/v1.0.0/dist/repo.js';
      expect(resolveGitHubRawUrl('github.com/user/repo@v1.0.0', isBuiltinLibraryFn)).toBe(expected);
    });
  });

  describe('resolveWebLibraryUrl', () => {
    it('should return relative paths starting with ../ as-is', () => {
      expect(resolveWebLibraryUrl('../my-lib.js')).toBe('../my-lib.js');
    });

    it('should return relative paths starting with ./ as-is', () => {
      expect(resolveWebLibraryUrl('./my-lib.js')).toBe('./my-lib.js');
    });

    it('should return absolute paths as-is', () => {
      expect(resolveWebLibraryUrl('/my-lib.js')).toBe('/my-lib.js');
    });

    it('should add /libs/ prefix and .js extension', () => {
      expect(resolveWebLibraryUrl('my-lib')).toBe('/libs/my-lib.js');
    });

    it('should add /libs/ prefix to files with .js extension', () => {
      expect(resolveWebLibraryUrl('my-lib.js')).toBe('/libs/my-lib.js');
    });
  });

  describe('getLibrarySources', () => {
    const isBuiltinLibraryFn = (name) => false;

    it('should include release sources for semver tags', () => {
      const sources = getLibrarySources('my-lib@1.2.3', isBuiltinLibraryFn);
      expect(sources.some(s => s.type === 'GitHub Release')).toBe(true);
    });

    it('should not include release sources for non-semver tags', () => {
      const sources = getLibrarySources('my-lib@main', isBuiltinLibraryFn);
      expect(sources.some(s => s.type === 'GitHub Release')).toBe(false);
    });

    it('should always include GitHub raw source', () => {
      const sources = getLibrarySources('my-lib@1.2.3', isBuiltinLibraryFn);
      expect(sources.some(s => s.type === 'GitHub Raw')).toBe(true);
      const sources2 = getLibrarySources('my-lib@main', isBuiltinLibraryFn);
      expect(sources2.some(s => s.type === 'GitHub Raw')).toBe(true);
    });
  });

  describe('shouldTryCDN', () => {
    const isBuiltinLibraryFn = (name) => name === 'builtin-lib';

    it('should return false for builtin libraries', () => {
      expect(shouldTryCDN('builtin-lib', isBuiltinLibraryFn)).toBe(false);
    });

    it('should return true for third-party libraries', () => {
      expect(shouldTryCDN('my-lib', isBuiltinLibraryFn)).toBe(true);
    });

    it('should return true for module libraries', () => {
      expect(shouldTryCDN('github.com/user/repo', isBuiltinLibraryFn)).toBe(true);
    });
  });

  describe('getCDNSources', () => {
    const isBuiltinLibraryFn = (name) => false;

    it('should generate unpkg and jsDelivr CDN URLs', () => {
      const sources = getCDNSources('my-lib', 'my-lib', '1.2.3', isBuiltinLibraryFn);
      expect(sources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'unpkg CDN', url: 'https://unpkg.com/my-lib@1.2.3/dist/my-lib.js' }),
          expect.objectContaining({ type: 'jsDelivr CDN', url: 'https://cdn.jsdelivr.net/npm/my-lib@1.2.3/dist/my-lib.js' }),
        ])
      );
    });

    it('should use "latest" for main tag', () => {
      const sources = getCDNSources('my-lib', 'my-lib', 'main', isBuiltinLibraryFn);
      expect(sources[0].url).toContain('@latest');
    });

    it('should use "latest" for latest tag', () => {
      const sources = getCDNSources('my-lib', 'my-lib', 'latest', isBuiltinLibraryFn);
      expect(sources[0].url).toContain('@latest');
    });

    it('should generate jsDelivr GitHub URL for module paths', () => {
      const sources = getCDNSources('github.com/user/repo', 'repo', 'main', isBuiltinLibraryFn);
      expect(sources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'jsDelivr GitHub', url: 'https://cdn.jsdelivr.net/gh/user/repo@main/dist/repo.js' }),
        ])
      );
    });
  });

  describe('getGitHubReleaseSources', () => {
    const isBuiltinLibraryFn = (name) => false;

    it('should generate all potential release asset URLs', () => {
      const sources = getGitHubReleaseSources('user/my-lib', 'my-lib', 'v1.0.0', isBuiltinLibraryFn);
      const expectedUrls = [
        'https://github.com/user/my-lib/releases/download/v1.0.0/my-lib-min.js',
        'https://github.com/user/my-lib/releases/download/v1.0.0/my-lib.js',
        'https://github.com/user/my-lib/releases/download/v1.0.0/my-lib-v1.0.0.js',
        'https://github.com/user/my-lib/releases/download/v1.0.0/bundle.js',
        'https://github.com/user/my-lib/releases/download/v1.0.0/index.js',
      ];
      const actualUrls = sources.map(s => s.url);
      expect(actualUrls).toEqual(expectedUrls);
    });
  });
});
