/**
 * Interpreter Library Management Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const {
  requireWithDependencies,
  isLibraryLoaded,
  getDependencyInfo,
  getLoadOrder,
  validateNoCycles,
  clearLibraryCache,
  getCacheInfo,
  validateLoadingQueue,
  updateLoadingStatus,
} = require('../src/interpreter-library-management');

describe('Interpreter Library Management', () => {
  let loadingQueue;
  let loadedLibraries;
  let dependencyGraph;

  beforeEach(() => {
    loadingQueue = new Set();
    loadedLibraries = new Set();
    dependencyGraph = new Map();
  });

  // Tests will go here
  describe('isLibraryLoaded', () => {
    it('should return true if library is in the loaded set', () => {
      loadedLibraries.add('libA');
      expect(isLibraryLoaded('libA', loadedLibraries, () => ({}))).toBe(true);
    });

    it('should return false if library is not loaded', () => {
      expect(isLibraryLoaded('libA', loadedLibraries, () => ({}))).toBe(false);
    });

    it('should return true if library namespace exists and has functions', () => {
      const getLibraryNamespaceFn = (name) => {
        if (name === 'libA') {
          return { func1: () => {} };
        }
        return null;
      };
      expect(isLibraryLoaded('libA', loadedLibraries, getLibraryNamespaceFn)).toBe(true);
      expect(loadedLibraries.has('libA')).toBe(true);
    });

    it('should return false if library namespace is empty', () => {
      const getLibraryNamespaceFn = (name) => ({});
      expect(isLibraryLoaded('libA', loadedLibraries, getLibraryNamespaceFn)).toBe(false);
    });
  });

  describe('clearLibraryCache', () => {
    it('should clear all library tracking sets and maps', () => {
      loadedLibraries.add('libA');
      dependencyGraph.set('libA', {});
      loadingQueue.add('libB');
      const clearedCount = clearLibraryCache(loadedLibraries, dependencyGraph, loadingQueue);
      expect(clearedCount).toBe(1);
      expect(loadedLibraries.size).toBe(0);
      expect(dependencyGraph.size).toBe(0);
      expect(loadingQueue.size).toBe(0);
    });
  });

  describe('getCacheInfo', () => {
    it('should return correct cache statistics', () => {
      loadedLibraries.add('libA');
      dependencyGraph.set('libA', {});
      loadingQueue.add('libB');
      const info = getCacheInfo(loadedLibraries, dependencyGraph, loadingQueue);
      expect(info).toEqual({
        loadedCount: 1,
        dependencyNodes: 1,
        currentlyLoading: 1,
        loadedLibraries: ['libA'],
        loadingLibraries: ['libB'],
      });
    });
  });

  describe('validateLoadingQueue', () => {
    it('should return true if library is not in loading queue', () => {
      expect(validateLoadingQueue('libA', loadingQueue)).toBe(true);
    });

    it('should throw an error if library is already in loading queue', () => {
      loadingQueue.add('libA');
      expect(() => validateLoadingQueue('libA', loadingQueue)).toThrow('Circular dependency detected');
    });
  });

  describe('updateLoadingStatus', () => {
    it('should update loading status to loading', () => {
      updateLoadingStatus('libA', 'loading', dependencyGraph);
      expect(dependencyGraph.get('libA')).toEqual({
        dependencies: [],
        dependents: [],
        loading: true,
        error: null,
      });
    });

    it('should update loading status to loaded', () => {
      updateLoadingStatus('libA', 'loaded', dependencyGraph);
      expect(dependencyGraph.get('libA')).toEqual({
        dependencies: [],
        dependents: [],
        loading: false,
        loaded: true,
        error: null,
      });
    });

    it('should update loading status to error', () => {
      const error = new Error('test error');
      updateLoadingStatus('libA', 'error', dependencyGraph, error);
      expect(dependencyGraph.get('libA')).toEqual({
        dependencies: [],
        dependents: [],
        loading: false,
        loaded: false,
        error,
      });
    });
  });

  describe('Dependency Graph Functions', () => {
    beforeEach(() => {
      dependencyGraph.set('libA', { dependencies: ['libB'], dependents: ['libC'], loading: false });
      dependencyGraph.set('libB', { dependencies: [], dependents: ['libA'], loading: false });
      dependencyGraph.set('libC', { dependencies: ['libA'], dependents: [], loading: false });
    });

    describe('getDependencyInfo', () => {
      it('should return dependency information', () => {
        const info = getDependencyInfo(dependencyGraph);
        expect(info).toEqual({
          libA: { dependencies: ['libB'], dependents: ['libC'], loading: false },
          libB: { dependencies: [], dependents: ['libA'], loading: false },
          libC: { dependencies: ['libA'], dependents: [], loading: false },
        });
      });
    });

    describe('getLoadOrder', () => {
      it('should return a valid load order', () => {
        const order = getLoadOrder(dependencyGraph);
        expect(order.indexOf('libB')).toBeLessThan(order.indexOf('libA'));
        expect(order.indexOf('libA')).toBeLessThan(order.indexOf('libC'));
      });

      it('should throw an error for circular dependencies', () => {
        dependencyGraph.get('libB').dependencies.push('libC');
        expect(() => getLoadOrder(dependencyGraph)).toThrow('Circular dependency detected');
      });
    });

    describe('validateNoCycles', () => {
      it('should return true if no cycles exist', () => {
        expect(validateNoCycles(dependencyGraph)).toBe(true);
      });

      it('should return false if a cycle exists', () => {
        dependencyGraph.get('libB').dependencies.push('libC');
        expect(validateNoCycles(dependencyGraph)).toBe(false);
      });
    });
  });

  describe('requireWithDependencies', () => {
    let checkLibraryPermissionsFn;
    let isLibraryLoadedFn;
    let detectAndRegisterAddressTargetsFn;
    let loadSingleLibraryFn;
    let extractDependenciesFn;
    let registerLibraryFunctionsFn;

    beforeEach(() => {
      checkLibraryPermissionsFn = jest.fn().mockResolvedValue(true);
      isLibraryLoadedFn = jest.fn((name) => loadedLibraries.has(name));
      detectAndRegisterAddressTargetsFn = jest.fn();
      loadSingleLibraryFn = jest.fn().mockResolvedValue(true);
      extractDependenciesFn = jest.fn().mockResolvedValue([]);
      registerLibraryFunctionsFn = jest.fn();
    });

    it('should load a single library with no dependencies', async () => {
      await requireWithDependencies(
        'libA',
        loadingQueue,
        checkLibraryPermissionsFn,
        isLibraryLoadedFn,
        detectAndRegisterAddressTargetsFn,
        loadSingleLibraryFn,
        extractDependenciesFn,
        dependencyGraph,
        registerLibraryFunctionsFn
      );

      expect(checkLibraryPermissionsFn).toHaveBeenCalledWith('libA');
      expect(loadSingleLibraryFn).toHaveBeenCalledWith('libA');
      expect(extractDependenciesFn).toHaveBeenCalledWith('libA');
      expect(detectAndRegisterAddressTargetsFn).toHaveBeenCalledWith('libA');
      expect(registerLibraryFunctionsFn).toHaveBeenCalledWith('libA');
      expect(dependencyGraph.get('libA')).toEqual({
        dependencies: [],
        dependents: [],
        loading: false,
      });
    });

    it('should handle circular dependencies', async () => {
        extractDependenciesFn.mockImplementation((name) => {
            if (name === 'libA') return ['libB'];
            if (name === 'libB') return ['libA'];
            return [];
        });

        await expect(
            requireWithDependencies(
                'libA',
                loadingQueue,
                checkLibraryPermissionsFn,
                isLibraryLoadedFn,
                detectAndRegisterAddressTargetsFn,
                loadSingleLibraryFn,
                extractDependenciesFn,
                dependencyGraph,
                registerLibraryFunctionsFn
            )
        ).rejects.toThrow('Circular dependency detected: libA is already loading');
    });

    it('should not reload an already loaded library', async () => {
      loadedLibraries.add('libA');
      await requireWithDependencies(
        'libA',
        loadingQueue,
        checkLibraryPermissionsFn,
        isLibraryLoadedFn,
        detectAndRegisterAddressTargetsFn,
        loadSingleLibraryFn,
        extractDependenciesFn,
        dependencyGraph,
        registerLibraryFunctionsFn
      );
      expect(loadSingleLibraryFn).not.toHaveBeenCalled();
    });
  });
});
