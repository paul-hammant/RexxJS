/**
 * Composite Output Handler Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const CompositeOutputHandler = require('../src/composite-output-handler');

describe('CompositeOutputHandler', () => {
  let handler;
  let mockHandler1, mockHandler2, mockHandler3;

  beforeEach(() => {
    handler = new CompositeOutputHandler();
    mockHandler1 = jest.fn();
    mockHandler2 = jest.fn();
    mockHandler3 = jest.fn();
  });

  describe('constructor', () => {
    it('should create empty handler map', () => {
      expect(handler.handlers.size).toBe(0);
    });
  });

  describe('addHandler', () => {
    it('should add a handler with a name', () => {
      handler.addHandler('test', mockHandler1);
      expect(handler.handlers.has('test')).toBe(true);
      expect(handler.handlers.get('test')).toBe(mockHandler1);
    });

    it('should return this for method chaining', () => {
      const result = handler.addHandler('test', mockHandler1);
      expect(result).toBe(handler);
    });

    it('should throw error for non-function handler', () => {
      expect(() => handler.addHandler('test', 'not a function')).toThrow(
        "Output handler for 'test' must be a function"
      );
    });

    it('should replace existing handler with same name', () => {
      handler.addHandler('test', mockHandler1);
      handler.addHandler('test', mockHandler2);
      expect(handler.handlers.get('test')).toBe(mockHandler2);
      expect(handler.handlers.size).toBe(1);
    });
  });

  describe('removeHandler', () => {
    it('should remove existing handler', () => {
      handler.addHandler('test', mockHandler1);
      const result = handler.removeHandler('test');
      expect(result).toBe(true);
      expect(handler.handlers.has('test')).toBe(false);
    });

    it('should return false for non-existing handler', () => {
      const result = handler.removeHandler('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getHandler', () => {
    it('should return existing handler', () => {
      handler.addHandler('test', mockHandler1);
      expect(handler.getHandler('test')).toBe(mockHandler1);
    });

    it('should return undefined for non-existing handler', () => {
      expect(handler.getHandler('nonexistent')).toBeUndefined();
    });
  });

  describe('getHandlerNames', () => {
    it('should return empty array for no handlers', () => {
      expect(handler.getHandlerNames()).toEqual([]);
    });

    it('should return array of handler names', () => {
      handler.addHandler('first', mockHandler1);
      handler.addHandler('second', mockHandler2);
      const names = handler.getHandlerNames();
      expect(names).toHaveLength(2);
      expect(names).toContain('first');
      expect(names).toContain('second');
    });
  });

  describe('clear', () => {
    it('should remove all handlers', () => {
      handler.addHandler('first', mockHandler1);
      handler.addHandler('second', mockHandler2);
      handler.clear();
      expect(handler.handlers.size).toBe(0);
    });
  });

  describe('output', () => {
    it('should call all registered handlers with text', () => {
      handler.addHandler('first', mockHandler1);
      handler.addHandler('second', mockHandler2);
      
      handler.output('test message');
      
      expect(mockHandler1).toHaveBeenCalledWith('test message');
      expect(mockHandler2).toHaveBeenCalledWith('test message');
    });

    it('should work with no handlers', () => {
      expect(() => handler.output('test')).not.toThrow();
    });

    it('should collect and throw errors from failed handlers', () => {
      const errorHandler1 = jest.fn().mockImplementation(() => {
        throw new Error('Handler 1 failed');
      });
      const errorHandler2 = jest.fn().mockImplementation(() => {
        throw new Error('Handler 2 failed');
      });

      handler.addHandler('error1', errorHandler1);
      handler.addHandler('error2', errorHandler2);
      handler.addHandler('success', mockHandler1);

      expect(() => handler.output('test')).toThrow(
        'Output handler errors: error1: Handler 1 failed, error2: Handler 2 failed'
      );

      expect(mockHandler1).toHaveBeenCalledWith('test');
    });

    it('should continue calling handlers even if some fail', () => {
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error('Failed');
      });

      handler.addHandler('error', errorHandler);
      handler.addHandler('success1', mockHandler1);
      handler.addHandler('success2', mockHandler2);

      expect(() => handler.output('test')).toThrow();
      expect(mockHandler1).toHaveBeenCalledWith('test');
      expect(mockHandler2).toHaveBeenCalledWith('test');
    });
  });

  describe('create static method', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      console.log.mockRestore();
    });

    it('should create handler with console by default', () => {
      const composite = CompositeOutputHandler.create();
      expect(composite.getHandlerNames()).toContain('console');
    });

    it('should not include console when disabled', () => {
      const composite = CompositeOutputHandler.create({ console: false });
      expect(composite.getHandlerNames()).not.toContain('console');
    });

    it('should add custom log handler', () => {
      const logHandler = jest.fn();
      const composite = CompositeOutputHandler.create({ log: logHandler });
      
      expect(composite.getHandlerNames()).toContain('log');
      composite.output('test');
      expect(logHandler).toHaveBeenCalledWith('test');
    });

    it('should add RPC handler', () => {
      const rpcHandler = jest.fn();
      const composite = CompositeOutputHandler.create({ rpc: rpcHandler });
      
      expect(composite.getHandlerNames()).toContain('rpc');
      composite.output('test');
      expect(rpcHandler).toHaveBeenCalledWith('test');
    });

    it('should add file handler', () => {
      const fileHandler = jest.fn();
      const composite = CompositeOutputHandler.create({ file: fileHandler });
      
      expect(composite.getHandlerNames()).toContain('file');
      composite.output('test');
      expect(fileHandler).toHaveBeenCalledWith('test');
    });

    it('should create composite with multiple handlers', () => {
      const logHandler = jest.fn();
      const rpcHandler = jest.fn();
      const fileHandler = jest.fn();
      
      const composite = CompositeOutputHandler.create({
        log: logHandler,
        rpc: rpcHandler,
        file: fileHandler
      });
      
      const names = composite.getHandlerNames();
      expect(names).toContain('console');
      expect(names).toContain('log');
      expect(names).toContain('rpc');
      expect(names).toContain('file');
      
      composite.output('test message');
      expect(console.log).toHaveBeenCalledWith('test message');
      expect(logHandler).toHaveBeenCalledWith('test message');
      expect(rpcHandler).toHaveBeenCalledWith('test message');
      expect(fileHandler).toHaveBeenCalledWith('test message');
    });

    it('should ignore non-function handlers in create', () => {
      const composite = CompositeOutputHandler.create({
        log: 'not a function',
        rpc: null,
        file: undefined
      });
      
      expect(composite.getHandlerNames()).toEqual(['console']);
    });
  });
});