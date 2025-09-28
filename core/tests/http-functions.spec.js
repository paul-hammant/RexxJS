/**
 * HTTP Functions Tests
 * Tests for HTTP_GET, HTTP_POST, HTTP_PUT, and HTTP_DELETE functions
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { httpFunctions } = require('../src/http-functions');

// Mock fetch for testing
global.fetch = jest.fn();

describe('HTTP Functions', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockReset();
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  describe('HTTP_GET function', () => {
    test('should make GET request and return response body', async () => {
      const mockResponse = 'Hello World';
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockResponse)
      });

      const result = await httpFunctions.HTTP_GET('https://api.example.com/test');

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'GET',
        headers: {}
      });
      expect(result).toBe(mockResponse);
    });

    test('should handle GET request with custom headers', async () => {
      const mockResponse = '{"data": "test"}';
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockResponse)
      });

      const headers = {
        'Authorization': 'Bearer token123',
        'Accept': 'application/json'
      };

      const result = await httpFunctions.HTTP_GET('https://api.example.com/test', headers);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token123',
          'Accept': 'application/json'
        }
      });
      expect(result).toBe(mockResponse);
    });

    test('should handle fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await httpFunctions.HTTP_GET('https://api.example.com/test');

      expect(result).toBe('ERROR: Network error');
    });

    test('should validate URL parameter', async () => {
      const result = await httpFunctions.HTTP_GET('');
      expect(result).toBe('ERROR: HTTP_GET requires a valid URL string');
    });

    test('should handle non-string URL', async () => {
      const result = await httpFunctions.HTTP_GET(null);
      expect(result).toBe('ERROR: HTTP_GET requires a valid URL string');
    });

    test('should trim URL whitespace', async () => {
      const mockResponse = 'test';
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockResponse)
      });

      await httpFunctions.HTTP_GET('  https://api.example.com/test  ');

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'GET',
        headers: {}
      });
    });
  });

  describe('HTTP_POST function', () => {
    test('should make POST request with body and return response', async () => {
      const mockResponse = 'Created';
      const requestBody = '{"name": "test"}';

      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockResponse)
      });

      const result = await httpFunctions.HTTP_POST('https://api.example.com/create', requestBody);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      expect(result).toBe(mockResponse);
    });

    test('should handle POST request with custom headers', async () => {
      const mockResponse = 'Success';
      const requestBody = 'test data';
      const headers = {
        'Content-Type': 'text/plain',
        'Authorization': 'Bearer token'
      };

      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockResponse)
      });

      const result = await httpFunctions.HTTP_POST('https://api.example.com/create', requestBody, headers);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': 'Bearer token'
        },
        body: requestBody
      });
      expect(result).toBe(mockResponse);
    });

    test('should handle empty body', async () => {
      const mockResponse = 'OK';

      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockResponse)
      });

      const result = await httpFunctions.HTTP_POST('https://api.example.com/create');

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: ''
      });
      expect(result).toBe(mockResponse);
    });

    test('should handle POST fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Server error'));

      const result = await httpFunctions.HTTP_POST('https://api.example.com/create', 'data');

      expect(result).toBe('ERROR: Server error');
    });

    test('should validate POST URL parameter', async () => {
      const result = await httpFunctions.HTTP_POST('');
      expect(result).toBe('ERROR: HTTP_POST requires a valid URL string');
    });
  });

  describe('HTTP_PUT function', () => {
    test('should make PUT request with body and return response', async () => {
      const mockResponse = 'Updated';
      const requestBody = '{"id": 123, "name": "updated"}';

      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockResponse)
      });

      const result = await httpFunctions.HTTP_PUT('https://api.example.com/update/123', requestBody);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/update/123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      expect(result).toBe(mockResponse);
    });

    test('should handle PUT fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Update failed'));

      const result = await httpFunctions.HTTP_PUT('https://api.example.com/update/123', 'data');

      expect(result).toBe('ERROR: Update failed');
    });

    test('should validate PUT URL parameter', async () => {
      const result = await httpFunctions.HTTP_PUT('');
      expect(result).toBe('ERROR: HTTP_PUT requires a valid URL string');
    });
  });

  describe('HTTP_DELETE function', () => {
    test('should make DELETE request and return response', async () => {
      const mockResponse = 'Deleted';

      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockResponse)
      });

      const result = await httpFunctions.HTTP_DELETE('https://api.example.com/delete/123');

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/delete/123', {
        method: 'DELETE',
        headers: {}
      });
      expect(result).toBe(mockResponse);
    });

    test('should handle DELETE request with custom headers', async () => {
      const mockResponse = 'Deleted successfully';
      const headers = {
        'Authorization': 'Bearer token123'
      };

      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockResponse)
      });

      const result = await httpFunctions.HTTP_DELETE('https://api.example.com/delete/123', headers);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/delete/123', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer token123'
        }
      });
      expect(result).toBe(mockResponse);
    });

    test('should handle DELETE fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Delete failed'));

      const result = await httpFunctions.HTTP_DELETE('https://api.example.com/delete/123');

      expect(result).toBe('ERROR: Delete failed');
    });

    test('should validate DELETE URL parameter', async () => {
      const result = await httpFunctions.HTTP_DELETE('');
      expect(result).toBe('ERROR: HTTP_DELETE requires a valid URL string');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete REST workflow', async () => {
      // Mock GET request
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve('{"users": []}')
      });

      // Mock POST request
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve('{"id": 1, "name": "John"}')
      });

      // Mock PUT request
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve('{"id": 1, "name": "John Updated"}')
      });

      // Mock DELETE request
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve('{"success": true}')
      });

      // Execute REST workflow
      const getResult = await httpFunctions.HTTP_GET('https://api.example.com/users');
      const postResult = await httpFunctions.HTTP_POST('https://api.example.com/users', '{"name": "John"}');
      const putResult = await httpFunctions.HTTP_PUT('https://api.example.com/users/1', '{"name": "John Updated"}');
      const deleteResult = await httpFunctions.HTTP_DELETE('https://api.example.com/users/1');

      expect(getResult).toBe('{"users": []}');
      expect(postResult).toBe('{"id": 1, "name": "John"}');
      expect(putResult).toBe('{"id": 1, "name": "John Updated"}');
      expect(deleteResult).toBe('{"success": true}');

      // Verify all calls were made correctly
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    test('should handle non-object headers gracefully', async () => {
      const mockResponse = 'OK';
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockResponse)
      });

      // Test with null headers
      const result = await httpFunctions.HTTP_GET('https://api.example.com/test', null);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'GET',
        headers: {}
      });
      expect(result).toBe(mockResponse);
    });

    test('should convert non-string values to strings', async () => {
      const mockResponse = 'OK';
      fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(mockResponse)
      });

      const headers = {
        'X-Custom-Number': 123,
        'X-Custom-String': 'test'
      };

      await httpFunctions.HTTP_GET('https://api.example.com/test', headers);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'GET',
        headers: {
          'X-Custom-Number': '123',
          'X-Custom-String': 'test'
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing fetch API', async () => {
      // Temporarily remove fetch
      const originalFetch = global.fetch;
      delete global.fetch;

      const result = await httpFunctions.HTTP_GET('https://api.example.com/test');

      expect(result).toBe('ERROR: HTTP_GET requires fetch API (available in browsers and modern Node.js)');

      // Restore fetch
      global.fetch = originalFetch;
    });

    test('should handle network timeouts', async () => {
      fetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await httpFunctions.HTTP_POST('https://api.example.com/slow', 'data');

      expect(result).toBe('ERROR: Timeout');
    });

    test('should handle malformed URLs', async () => {
      fetch.mockRejectedValueOnce(new Error('Invalid URL'));

      const result = await httpFunctions.HTTP_GET('not-a-url');

      expect(result).toBe('ERROR: Invalid URL');
    });
  });
});