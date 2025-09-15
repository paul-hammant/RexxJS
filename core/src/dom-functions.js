/**
 * DOM functions for REXX interpreter - Browser automation and manipulation
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

const domFunctions = {
  'QUERY': (params) => {
    try {
      if (typeof document === 'undefined') {
        throw new Error('DOM functions only available in browser environment');
      }
      
      
      const { selector, operation = 'exists', index = 0 } = params;
      if (!selector) {
        throw new Error('selector parameter is required');
      }
      
      const elements = document.querySelectorAll(selector);
      const targetIndex = parseInt(index) || 0;
      
      switch (operation.toLowerCase()) {
        case 'count':
          return elements.length;
          
        case 'exists':
          return elements.length > targetIndex;
          
        case 'visible':
          return elements.length > targetIndex && elements[targetIndex].offsetParent !== null;
          
        case 'text':
          return elements.length > targetIndex ? elements[targetIndex].textContent || '' : '';
          
        case 'value':
          if (elements.length <= targetIndex) return '';
          
          // If value is provided, set the element value
          if (params.value !== undefined) {
            elements[targetIndex].value = params.value;
            return params.value;
          }
          
          // Otherwise, return the current value
          return elements[targetIndex].value || '';
          
        case 'name':
          return elements.length > targetIndex ? elements[targetIndex].name || '' : '';
          
        case 'id':
          return elements.length > targetIndex ? elements[targetIndex].id || '' : '';
          
        case 'class':
          return elements.length > targetIndex ? elements[targetIndex].className || '' : '';
          
        case 'has_class':
          if (!params.class) return false;
          return elements.length > targetIndex && elements[targetIndex].classList.contains(params.class);
          
        case 'attribute':
          if (!params.attribute) return '';
          return elements.length > targetIndex ? elements[targetIndex].getAttribute(params.attribute) || '' : '';
          
        case 'dataset':
          if (!params.attribute) return '';
          if (elements.length <= targetIndex) return '';
          
          // If value is provided, set the dataset attribute
          if (params.value !== undefined) {
            elements[targetIndex].dataset[params.attribute] = params.value;
            return params.value;
          }
          
          // Otherwise, return the current value
          return elements[targetIndex].dataset[params.attribute] || '';
          
        case 'serialize':
          if (elements.length > targetIndex && elements[targetIndex].tagName === 'FORM') {
            const formData = new FormData(elements[targetIndex]);
            const result = {};
            for (const [key, value] of formData.entries()) {
              result[key] = value;
            }
            return JSON.stringify(result);
          }
          return '{}';
          
        default:
          throw new Error(`Unknown query operation: ${operation}`);
      }
    } catch (e) {
      throw new Error(`DOM query failed: ${e.message}`);
    }
  },

  'CLICK': (params) => {
    try {
      if (typeof document === 'undefined') {
        throw new Error('DOM functions only available in browser environment');
      }
      
      const { selector } = params;
      if (!selector) {
        throw new Error('selector parameter is required');
      }
      
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      element.click();
      return true;
    } catch (e) {
      throw new Error(`DOM click failed: ${e.message}`);
    }
  },

  'TYPE': (params) => {
    try {
      if (typeof document === 'undefined') {
        throw new Error('DOM functions only available in browser environment');
      }
      
      const { selector, text = '' } = params;
      if (!selector) {
        throw new Error('selector parameter is required');
      }
      
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      // Set the value
      element.value = text;
      
      // Trigger input events to notify frameworks
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      return true;
    } catch (e) {
      throw new Error(`DOM type failed: ${e.message}`);
    }
  },

  'SET': (params) => {
    try {
      if (typeof document === 'undefined') {
        throw new Error('DOM functions only available in browser environment');
      }
      
      const { selector, property, value } = params;
      if (!selector || !property) {
        throw new Error('selector and property parameters are required');
      }
      
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      element[property] = value;
      return true;
    } catch (e) {
      throw new Error(`DOM set failed: ${e.message}`);
    }
  },

  'ADD_CLASS': (params) => {
    try {
      if (typeof document === 'undefined') {
        throw new Error('DOM functions only available in browser environment');
      }
      
      const { selector, class: className } = params;
      if (!selector || !className) {
        throw new Error('selector and class parameters are required');
      }
      
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      element.classList.add(className);
      return true;
    } catch (e) {
      throw new Error(`DOM add_class failed: ${e.message}`);
    }
  },

  'REMOVE_CLASS': (params) => {
    try {
      if (typeof document === 'undefined') {
        throw new Error('DOM functions only available in browser environment');
      }
      
      const { selector, class: className } = params;
      if (!selector || !className) {
        throw new Error('selector and class parameters are required');
      }
      
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      element.classList.remove(className);
      return true;
    } catch (e) {
      throw new Error(`DOM remove_class failed: ${e.message}`);
    }
  },

  'SET_STYLE': (params) => {
    try {
      if (typeof document === 'undefined') {
        throw new Error('DOM functions only available in browser environment');
      }
      
      const { selector, property, value } = params;
      if (!selector || !property) {
        throw new Error('selector and property parameters are required');
      }
      
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      element.style[property] = value;
      return true;
    } catch (e) {
      throw new Error(`DOM set_style failed: ${e.message}`);
    }
  },

  'WAIT_FOR': (params) => {
    if (typeof document === 'undefined') {
      throw new Error('DOM functions only available in browser environment');
    }
    
    const { selector, timeout = 5000 } = params;
    if (!selector) {
      throw new Error('selector parameter is required');
    }
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const check = () => {
        const element = document.querySelector(selector);
        if (element && element.offsetParent !== null) {
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime >= timeout) {
          resolve(false);
          return;
        }
        
        setTimeout(check, 100);
      };
      
      check();
    });
  },

  'WAIT': (params) => {
    const { milliseconds = 1000 } = params;
    return new Promise(resolve => {
      setTimeout(() => resolve(true), Math.max(0, parseInt(milliseconds)));
    });
  },

  'SELECT_OPTION': (params) => {
    try {
      if (typeof document === 'undefined') {
        throw new Error('DOM functions only available in browser environment');
      }
      
      const { selector, value } = params;
      if (!selector) {
        throw new Error('selector parameter is required');
      }
      
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      if (element.tagName !== 'SELECT') {
        throw new Error('Element must be a SELECT element');
      }
      
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      return true;
    } catch (e) {
      throw new Error(`DOM select_option failed: ${e.message}`);
    }
  },

  'SLEEP': async (milliseconds) => {
    const ms = parseInt(milliseconds) || 1000;
    await new Promise(resolve => setTimeout(resolve, ms));
    return true;
  }

  //TODO insert more DOM functions here
  // Note: Advanced DOM functions like DOM_GET, DOM_ELEMENT_CLICK etc. 
  // require the DOM Manager which is part of the interpreter class

};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { domFunctions };
} else if (typeof window !== 'undefined') {
  window.domFunctions = domFunctions;
}