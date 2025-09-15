/**
 * Utility Functions Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { generateRequestId, isBuiltinLibrary, detectEnvironment } = require('../src/utils');

describe('Utility Functions', () => {
  describe('generateRequestId', () => {
    test('should generate a unique request ID', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });

  describe('isBuiltinLibrary', () => {
    test('should return true for built-in libraries', () => {
      expect(isBuiltinLibrary('math-functions')).toBe(true);
      expect(isBuiltinLibrary('string-functions')).toBe(true);
    });

    test('should return false for non-built-in libraries', () => {
      expect(isBuiltinLibrary('my-custom-library')).toBe(false);
    });
  });

  describe('detectEnvironment', () => {
    const originalWindow = global.window;
    const originalProcess = global.process;

    beforeEach(() => {
      // Reset the globals before each test
      global.window = undefined;
      global.process = undefined;
    });

    afterAll(() => {
      // Restore the original globals
      global.window = originalWindow;
      global.process = originalProcess;
    });

    test('should detect Node.js environment', () => {
      global.process = originalProcess;
      expect(detectEnvironment()).toBe('nodejs');
    });

    test('should detect web-standalone environment', () => {
      const windowMock = {};
      windowMock.parent = windowMock; // In a standalone window, parent is itself
      global.window = windowMock;
      expect(detectEnvironment()).toBe('web-standalone');
    });

    test('should detect web-controlbus environment', () => {
      global.window = { parent: {} }; // In an iframe, parent is a different object
      expect(detectEnvironment()).toBe('web-controlbus');
    });

    test('should return unknown for unknown environments', () => {
      expect(detectEnvironment()).toBe('unknown');
    });
  });
});
