/**
 * HTTP request functions for REXX interpreter
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const httpFunctions = {
  'HTTP_GET': async (url, headers = {}) => {
    try {
      // Validate URL
      if (typeof url !== 'string' || !url.trim()) {
        throw new Error('HTTP_GET requires a valid URL string');
      }

      // Check if fetch is available
      if (typeof fetch === 'undefined') {
        throw new Error('HTTP_GET requires fetch API (available in browsers and modern Node.js)');
      }

      // Prepare headers object
      const fetchHeaders = {};
      if (headers && typeof headers === 'object') {
        // Convert Rexx compound variable to JavaScript object
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === 'string' || typeof value === 'number') {
            fetchHeaders[key] = String(value);
          }
        }
      }

      // Make the HTTP GET request
      const response = await fetch(url.trim(), {
        method: 'GET',
        headers: fetchHeaders
      });

      // Return the response body as a string
      const body = await response.text();
      return body;

    } catch (error) {
      // Return error message as string for Rexx to handle
      return `ERROR: ${error.message}`;
    }
  },

  'HTTP_POST': async (url, body = '', headers = {}) => {
    try {
      // Validate URL
      if (typeof url !== 'string' || !url.trim()) {
        throw new Error('HTTP_POST requires a valid URL string');
      }

      // Check if fetch is available
      if (typeof fetch === 'undefined') {
        throw new Error('HTTP_POST requires fetch API (available in browsers and modern Node.js)');
      }

      // Prepare headers object
      const fetchHeaders = {};
      if (headers && typeof headers === 'object') {
        // Convert Rexx compound variable to JavaScript object
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === 'string' || typeof value === 'number') {
            fetchHeaders[key] = String(value);
          }
        }
      }

      // Default Content-Type if not specified
      if (!fetchHeaders['Content-Type'] && !fetchHeaders['content-type']) {
        fetchHeaders['Content-Type'] = 'application/json';
      }

      // Convert body to string
      const requestBody = body ? String(body) : '';

      // Make the HTTP POST request
      const response = await fetch(url.trim(), {
        method: 'POST',
        headers: fetchHeaders,
        body: requestBody
      });

      // Return the response body as a string
      const responseBody = await response.text();
      return responseBody;

    } catch (error) {
      // Return error message as string for Rexx to handle
      return `ERROR: ${error.message}`;
    }
  },

  'HTTP_PUT': async (url, body = '', headers = {}) => {
    try {
      // Validate URL
      if (typeof url !== 'string' || !url.trim()) {
        throw new Error('HTTP_PUT requires a valid URL string');
      }

      // Check if fetch is available
      if (typeof fetch === 'undefined') {
        throw new Error('HTTP_PUT requires fetch API (available in browsers and modern Node.js)');
      }

      // Prepare headers object
      const fetchHeaders = {};
      if (headers && typeof headers === 'object') {
        // Convert Rexx compound variable to JavaScript object
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === 'string' || typeof value === 'number') {
            fetchHeaders[key] = String(value);
          }
        }
      }

      // Default Content-Type if not specified
      if (!fetchHeaders['Content-Type'] && !fetchHeaders['content-type']) {
        fetchHeaders['Content-Type'] = 'application/json';
      }

      // Convert body to string
      const requestBody = body ? String(body) : '';

      // Make the HTTP PUT request
      const response = await fetch(url.trim(), {
        method: 'PUT',
        headers: fetchHeaders,
        body: requestBody
      });

      // Return the response body as a string
      const responseBody = await response.text();
      return responseBody;

    } catch (error) {
      // Return error message as string for Rexx to handle
      return `ERROR: ${error.message}`;
    }
  },

  'HTTP_DELETE': async (url, headers = {}) => {
    try {
      // Validate URL
      if (typeof url !== 'string' || !url.trim()) {
        throw new Error('HTTP_DELETE requires a valid URL string');
      }

      // Check if fetch is available
      if (typeof fetch === 'undefined') {
        throw new Error('HTTP_DELETE requires fetch API (available in browsers and modern Node.js)');
      }

      // Prepare headers object
      const fetchHeaders = {};
      if (headers && typeof headers === 'object') {
        // Convert Rexx compound variable to JavaScript object
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === 'string' || typeof value === 'number') {
            fetchHeaders[key] = String(value);
          }
        }
      }

      // Make the HTTP DELETE request
      const response = await fetch(url.trim(), {
        method: 'DELETE',
        headers: fetchHeaders
      });

      // Return the response body as a string
      const body = await response.text();
      return body;

    } catch (error) {
      // Return error message as string for Rexx to handle
      return `ERROR: ${error.message}`;
    }
  }
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { httpFunctions };
} else if (typeof window !== 'undefined') {
  window.httpFunctions = httpFunctions;
}