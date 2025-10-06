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
  'DOM_QUERY': (params) => {
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

  'DOM_CLICK': (params) => {
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

  'DOM_TYPE': (params) => {
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

  'DOM_SET': (params) => {
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

  'DOM_ADD_CLASS': (params) => {
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

  'DOM_REMOVE_CLASS': (params) => {
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

  'DOM_SET_STYLE': (params) => {
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

  'DOM_WAIT_FOR': (params) => {
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

  'DOM_WAIT': (params) => {
    const { milliseconds = 1000 } = params;
    return new Promise(resolve => {
      setTimeout(() => resolve(true), Math.max(0, parseInt(milliseconds)));
    });
  },

  'DOM_SELECT_OPTION': (params) => {
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

  'DOM_SLEEP': async (milliseconds) => {
    const ms = parseInt(milliseconds) || 1000;
    await new Promise(resolve => setTimeout(resolve, ms));
    return true;
  },
  
  'SLEEP': async (params) => {
    const ms = (params && params.ms !== undefined) ? parseInt(params.ms) : 
               (typeof params === 'number') ? params : 1000;
    await new Promise(resolve => setTimeout(resolve, ms));
    return true;
  }

  // Element reference functions - require DOM Manager from interpreter
  'DOM_GET': function(params) {
    // This function needs to be called with interpreter context
    if (!this.domElementManager) {
      throw new Error('DOM_GET requires DOM Element Manager (browser only)');
    }
    
    const selector = params.selector || params;
    if (!selector) {
      throw new Error('DOM_GET requires a selector parameter');
    }
    
    try {
      return this.domElementManager.getElement(selector);
    } catch (error) {
      throw new Error(`DOM_GET failed: ${error.message}`);
    }
  },
  
  'DOM_GET_ALL': function(params) {
    // This function needs to be called with interpreter context
    if (!this.domElementManager) {
      throw new Error('DOM_GET_ALL requires DOM Element Manager (browser only)');
    }
    
    const selector = params.selector || params;
    if (!selector) {
      throw new Error('DOM_GET_ALL requires a selector parameter');
    }
    
    try {
      const refs = this.domElementManager.getAllElements(selector);
      // Convert to 1-indexed array for REXX compatibility
      const result = { length: refs.length };
      refs.forEach((ref, index) => {
        result[index + 1] = ref;
      });
      return result;
    } catch (error) {
      throw new Error(`DOM_GET_ALL failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_TEXT': async function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_TEXT requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_TEXT requires an element parameter');
    }
    
    try {
      return await this.domElementManager.getElementText(element);
    } catch (error) {
      throw new Error(`DOM_ELEMENT_TEXT failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_CLICK': async function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_CLICK requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_CLICK requires an element parameter');
    }
    
    try {
      await this.domElementManager.clickElement(element);
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_CLICK failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_SET_ATTR': async function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_SET_ATTR requires DOM Element Manager (browser only)');
    }
    
    const element = params.element;
    const name = params.name || params.attribute;
    const value = params.value;
    
    if (!element || !name || value === undefined) {
      throw new Error('DOM_ELEMENT_SET_ATTR requires element, name, and value parameters');
    }
    
    try {
      await this.domElementManager.setElementAttribute(element, name, value);
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_SET_ATTR failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_GET_ATTR': async function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_GET_ATTR requires DOM Element Manager (browser only)');
    }
    
    const element = params.element;
    const name = params.name || params.attribute;
    
    if (!element || !name) {
      throw new Error('DOM_ELEMENT_GET_ATTR requires element and name parameters');
    }
    
    try {
      return await this.domElementManager.getElementAttribute(element, name);
    } catch (error) {
      throw new Error(`DOM_ELEMENT_GET_ATTR failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_SET_STYLE': async function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_SET_STYLE requires DOM Element Manager (browser only)');
    }
    
    const element = params.element;
    const property = params.property || params.style;
    const value = params.value;
    
    if (!element || !property || value === undefined) {
      throw new Error('DOM_ELEMENT_SET_STYLE requires element, property, and value parameters');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      elem.style[property] = value;
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_SET_STYLE failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_QUERY': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_QUERY requires DOM Element Manager (browser only)');
    }
    
    const element = params.element;
    const selector = params.selector;
    
    if (!element || !selector) {
      throw new Error('DOM_ELEMENT_QUERY requires element and selector parameters');
    }
    
    try {
      return this.domElementManager.queryElement(element, selector);
    } catch (error) {
      throw new Error(`DOM_ELEMENT_QUERY failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_QUERY_ALL': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_QUERY_ALL requires DOM Element Manager (browser only)');
    }
    
    const element = params.element;
    const selector = params.selector;
    
    if (!element || !selector) {
      throw new Error('DOM_ELEMENT_QUERY_ALL requires element and selector parameters');
    }
    
    try {
      const parentElem = this.domElementManager.getElementFromRef(element);
      const refs = this.domElementManager.getAllElements(selector, parentElem);
      // Convert to 1-indexed array for REXX compatibility
      const result = { length: refs.length };
      refs.forEach((ref, index) => {
        result[index + 1] = ref;
      });
      return result;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_QUERY_ALL failed: ${error.message}`);
    }
  },

  // Phase 2: Element Navigation Functions
  
  'DOM_ELEMENT_PARENT': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_PARENT requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_PARENT requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      const parent = elem.parentElement;
      
      if (!parent) {
        throw new Error('Element has no parent');
      }
      
      // Create a new reference for the parent
      const parentRef = `dom_element_${this.domElementManager.nextElementId++}`;
      this.domElementManager.elementCache.set(parentRef, parent);
      this.domElementManager.elementSelectors.set(parentRef, { 
        selector: parent.tagName.toLowerCase(), 
        contextRef: null 
      });
      
      return parentRef;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_PARENT failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_CHILDREN': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_CHILDREN requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    const selector = params.selector || '*';
    
    if (!element) {
      throw new Error('DOM_ELEMENT_CHILDREN requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      const children = elem.querySelectorAll(`:scope > ${selector}`);
      const refs = [];
      
      for (const child of children) {
        const childRef = `dom_element_${this.domElementManager.nextElementId++}`;
        this.domElementManager.elementCache.set(childRef, child);
        this.domElementManager.elementSelectors.set(childRef, { 
          selector: child.tagName.toLowerCase(), 
          contextRef: element 
        });
        refs.push(childRef);
      }
      
      // Convert to 1-indexed array for REXX compatibility
      const result = { length: refs.length };
      refs.forEach((ref, index) => {
        result[index + 1] = ref;
      });
      return result;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_CHILDREN failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_SIBLINGS': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_SIBLINGS requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_SIBLINGS requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      const parent = elem.parentElement;
      
      if (!parent) {
        throw new Error('Element has no parent to get siblings from');
      }
      
      const siblings = Array.from(parent.children).filter(child => child !== elem);
      const refs = [];
      
      for (const sibling of siblings) {
        const siblingRef = `dom_element_${this.domElementManager.nextElementId++}`;
        this.domElementManager.elementCache.set(siblingRef, sibling);
        this.domElementManager.elementSelectors.set(siblingRef, { 
          selector: sibling.tagName.toLowerCase(), 
          contextRef: null 
        });
        refs.push(siblingRef);
      }
      
      // Convert to 1-indexed array for REXX compatibility
      const result = { length: refs.length };
      refs.forEach((ref, index) => {
        result[index + 1] = ref;
      });
      return result;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_SIBLINGS failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_NEXT_SIBLING': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_NEXT_SIBLING requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_NEXT_SIBLING requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      const next = elem.nextElementSibling;
      
      if (!next) {
        throw new Error('Element has no next sibling');
      }
      
      const nextRef = `dom_element_${this.domElementManager.nextElementId++}`;
      this.domElementManager.elementCache.set(nextRef, next);
      this.domElementManager.elementSelectors.set(nextRef, { 
        selector: next.tagName.toLowerCase(), 
        contextRef: null 
      });
      
      return nextRef;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_NEXT_SIBLING failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_PREV_SIBLING': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_PREV_SIBLING requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_PREV_SIBLING requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      const prev = elem.previousElementSibling;
      
      if (!prev) {
        throw new Error('Element has no previous sibling');
      }
      
      const prevRef = `dom_element_${this.domElementManager.nextElementId++}`;
      this.domElementManager.elementCache.set(prevRef, prev);
      this.domElementManager.elementSelectors.set(prevRef, { 
        selector: prev.tagName.toLowerCase(), 
        contextRef: null 
      });
      
      return prevRef;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_PREV_SIBLING failed: ${error.message}`);
    }
  },
  
  // Element Property Functions
  
  'DOM_ELEMENT_TAG': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_TAG requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_TAG requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      return elem.tagName.toUpperCase();
    } catch (error) {
      throw new Error(`DOM_ELEMENT_TAG failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_ID': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_ID requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_ID requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      return elem.id || '';
    } catch (error) {
      throw new Error(`DOM_ELEMENT_ID failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_CLASSES': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_CLASSES requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_CLASSES requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      const classes = Array.from(elem.classList);
      
      // Convert to 1-indexed array for REXX compatibility
      const result = { length: classes.length };
      classes.forEach((cls, index) => {
        result[index + 1] = cls;
      });
      return result;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_CLASSES failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_CLASS': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_CLASS requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_CLASS requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      return elem.className;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_CLASS failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_VISIBLE': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_VISIBLE requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_VISIBLE requires an element parameter');
    }
    
    try {
      return this.domElementManager.isElementVisible(element);
    } catch (error) {
      throw new Error(`DOM_ELEMENT_VISIBLE failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_BOUNDS': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_BOUNDS requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_BOUNDS requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      const rect = elem.getBoundingClientRect();
      
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right
      };
    } catch (error) {
      throw new Error(`DOM_ELEMENT_BOUNDS failed: ${error.message}`);
    }
  },

  // Phase 3: Advanced Operations - Element Creation
  
  'DOM_CREATE_ELEMENT': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_CREATE_ELEMENT requires DOM Element Manager (browser only)');
    }
    
    const tag = params.tag || params;
    if (!tag) {
      throw new Error('DOM_CREATE_ELEMENT requires a tag parameter');
    }
    
    try {
      const element = document.createElement(tag);
      
      // Set any additional attributes provided
      for (const [key, value] of Object.entries(params)) {
        if (key !== 'tag' && key !== 'text') {
          element.setAttribute(key, value);
        }
      }
      
      // Set text content if provided
      if (params.text) {
        element.textContent = params.text;
      }
      
      // Create a reference for the new element
      const elementRef = `dom_element_${this.domElementManager.nextElementId++}`;
      this.domElementManager.elementCache.set(elementRef, element);
      this.domElementManager.elementSelectors.set(elementRef, { 
        selector: tag.toLowerCase(), 
        contextRef: null 
      });
      
      return elementRef;
    } catch (error) {
      throw new Error(`DOM_CREATE_ELEMENT failed: ${error.message}`);
    }
  },
  
  'DOM_CREATE_TEXT': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_CREATE_TEXT requires DOM Element Manager (browser only)');
    }
    
    const text = params.text || params;
    if (!text) {
      throw new Error('DOM_CREATE_TEXT requires a text parameter');
    }
    
    try {
      const textNode = document.createTextNode(text);
      
      // Create a reference for the text node
      const textRef = `dom_element_${this.domElementManager.nextElementId++}`;
      this.domElementManager.elementCache.set(textRef, textNode);
      this.domElementManager.elementSelectors.set(textRef, { 
        selector: '#text', 
        contextRef: null 
      });
      
      return textRef;
    } catch (error) {
      throw new Error(`DOM_CREATE_TEXT failed: ${error.message}`);
    }
  },
  
  // Element Insertion Functions
  
  'DOM_ELEMENT_APPEND': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_APPEND requires DOM Element Manager (browser only)');
    }
    
    const parent = params.parent;
    const child = params.child;
    
    if (!parent || !child) {
      throw new Error('DOM_ELEMENT_APPEND requires parent and child parameters');
    }
    
    try {
      const parentElem = this.domElementManager.getElementFromRef(parent);
      const childElem = this.domElementManager.getElementFromRef(child);
      
      parentElem.appendChild(childElem);
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_APPEND failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_PREPEND': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_PREPEND requires DOM Element Manager (browser only)');
    }
    
    const parent = params.parent;
    const child = params.child;
    
    if (!parent || !child) {
      throw new Error('DOM_ELEMENT_PREPEND requires parent and child parameters');
    }
    
    try {
      const parentElem = this.domElementManager.getElementFromRef(parent);
      const childElem = this.domElementManager.getElementFromRef(child);
      
      parentElem.insertBefore(childElem, parentElem.firstChild);
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_PREPEND failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_INSERT_BEFORE': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_INSERT_BEFORE requires DOM Element Manager (browser only)');
    }
    
    const reference = params.reference;
    const newElement = params.new_element || params.element;
    
    if (!reference || !newElement) {
      throw new Error('DOM_ELEMENT_INSERT_BEFORE requires reference and new_element parameters');
    }
    
    try {
      const refElem = this.domElementManager.getElementFromRef(reference);
      const newElem = this.domElementManager.getElementFromRef(newElement);
      
      refElem.parentNode.insertBefore(newElem, refElem);
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_INSERT_BEFORE failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_INSERT_AFTER': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_INSERT_AFTER requires DOM Element Manager (browser only)');
    }
    
    const reference = params.reference;
    const newElement = params.new_element || params.element;
    
    if (!reference || !newElement) {
      throw new Error('DOM_ELEMENT_INSERT_AFTER requires reference and new_element parameters');
    }
    
    try {
      const refElem = this.domElementManager.getElementFromRef(reference);
      const newElem = this.domElementManager.getElementFromRef(newElement);
      
      refElem.parentNode.insertBefore(newElem, refElem.nextSibling);
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_INSERT_AFTER failed: ${error.message}`);
    }
  },
  
  // Element Removal and Replacement
  
  'DOM_ELEMENT_REMOVE': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_REMOVE requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_REMOVE requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      elem.parentNode.removeChild(elem);
      
      // Clean up the reference
      this.domElementManager.elementCache.delete(element);
      this.domElementManager.elementSelectors.delete(element);
      
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_REMOVE failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_REPLACE': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_REPLACE requires DOM Element Manager (browser only)');
    }
    
    const oldElement = params.old_element;
    const newElement = params.new_element;
    
    if (!oldElement || !newElement) {
      throw new Error('DOM_ELEMENT_REPLACE requires old_element and new_element parameters');
    }
    
    try {
      const oldElem = this.domElementManager.getElementFromRef(oldElement);
      const newElem = this.domElementManager.getElementFromRef(newElement);
      
      oldElem.parentNode.replaceChild(newElem, oldElem);
      
      // Clean up the old reference
      this.domElementManager.elementCache.delete(oldElement);
      this.domElementManager.elementSelectors.delete(oldElement);
      
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_REPLACE failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_CLONE': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_CLONE requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    const deep = params.deep !== false; // Default to true
    
    if (!element) {
      throw new Error('DOM_ELEMENT_CLONE requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      const cloned = elem.cloneNode(deep);
      
      // Create a reference for the cloned element
      const clonedRef = `dom_element_${this.domElementManager.nextElementId++}`;
      this.domElementManager.elementCache.set(clonedRef, cloned);
      this.domElementManager.elementSelectors.set(clonedRef, { 
        selector: cloned.tagName.toLowerCase(), 
        contextRef: null 
      });
      
      return clonedRef;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_CLONE failed: ${error.message}`);
    }
  },
  
  // Phase 3: Event Handling Functions
  
  'DOM_ELEMENT_ON_CLICK': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_ON_CLICK requires DOM Element Manager (browser only)');
    }
    
    const element = params.element;
    const handler = params.handler;
    
    if (!element || !handler) {
      throw new Error('DOM_ELEMENT_ON_CLICK requires element and handler parameters');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      
      // Create event handler function
      const eventHandler = (event) => {
        // Store event data for REXX access
        this.lastEvent = {
          type: 'click',
          target: element,
          clientX: event.clientX,
          clientY: event.clientY,
          button: event.button
        };
        
        // Call the handler (simple logging for now)
        console.log(`Event handler called: ${handler}`, event);
      };
      
      elem.addEventListener('click', eventHandler);
      
      // Store handler reference for removal
      if (!elem._rexxEventHandlers) {
        elem._rexxEventHandlers = new Map();
      }
      elem._rexxEventHandlers.set(`click_${handler}`, eventHandler);
      
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_ON_CLICK failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_ON_CHANGE': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_ON_CHANGE requires DOM Element Manager (browser only)');
    }
    
    const element = params.element;
    const handler = params.handler;
    
    if (!element || !handler) {
      throw new Error('DOM_ELEMENT_ON_CHANGE requires element and handler parameters');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      
      const eventHandler = (event) => {
        this.lastEvent = {
          type: 'change',
          target: element,
          value: event.target.value
        };
        
        console.log(`Change handler called: ${handler}`, event);
      };
      
      elem.addEventListener('change', eventHandler);
      
      if (!elem._rexxEventHandlers) {
        elem._rexxEventHandlers = new Map();
      }
      elem._rexxEventHandlers.set(`change_${handler}`, eventHandler);
      
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_ON_CHANGE failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_ON_EVENT': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_ON_EVENT requires DOM Element Manager (browser only)');
    }
    
    const element = params.element;
    const event = params.event;
    const handler = params.handler;
    
    if (!element || !event || !handler) {
      throw new Error('DOM_ELEMENT_ON_EVENT requires element, event, and handler parameters');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      
      const eventHandler = (e) => {
        this.lastEvent = {
          type: event,
          target: element,
          data: e
        };
        
        console.log(`Event handler called: ${handler} for ${event}`, e);
      };
      
      elem.addEventListener(event, eventHandler);
      
      if (!elem._rexxEventHandlers) {
        elem._rexxEventHandlers = new Map();
      }
      elem._rexxEventHandlers.set(`${event}_${handler}`, eventHandler);
      
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_ON_EVENT failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_OFF_EVENT': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_OFF_EVENT requires DOM Element Manager (browser only)');
    }
    
    const element = params.element;
    const event = params.event;
    const handler = params.handler;
    
    if (!element || !event || !handler) {
      throw new Error('DOM_ELEMENT_OFF_EVENT requires element, event, and handler parameters');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      
      if (elem._rexxEventHandlers) {
        const handlerKey = `${event}_${handler}`;
        const eventHandler = elem._rexxEventHandlers.get(handlerKey);
        
        if (eventHandler) {
          elem.removeEventListener(event, eventHandler);
          elem._rexxEventHandlers.delete(handlerKey);
        }
      }
      
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_OFF_EVENT failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_TRIGGER_EVENT': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_TRIGGER_EVENT requires DOM Element Manager (browser only)');
    }
    
    const element = params.element;
    const event = params.event;
    const data = params.data;
    
    if (!element || !event) {
      throw new Error('DOM_ELEMENT_TRIGGER_EVENT requires element and event parameters');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      
      let eventObj;
      if (data) {
        const eventData = typeof data === 'string' ? JSON.parse(data) : data;
        eventObj = new CustomEvent(event, { detail: eventData });
      } else {
        eventObj = new Event(event, { bubbles: true });
      }
      
      elem.dispatchEvent(eventObj);
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_TRIGGER_EVENT failed: ${error.message}`);
    }
  },

  // Phase 3: Element Creation and Manipulation
  'DOM_CREATE_ELEMENT': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_CREATE_ELEMENT requires DOM Element Manager (browser only)');
    }
    
    const tag = params.tag;
    if (!tag) {
      throw new Error('DOM_CREATE_ELEMENT requires a tag parameter');
    }
    
    try {
      const element = document.createElement(tag.toLowerCase());
      
      // Set attributes if provided
      Object.keys(params).forEach(key => {
        if (key !== 'tag') {
          if (key === 'text') {
            element.textContent = params[key];
          } else {
            element.setAttribute(key, params[key]);
          }
        }
      });
      
      const elementRef = `dom_element_${this.domElementManager.nextElementId++}`;
      this.domElementManager.elementCache.set(elementRef, element);
      this.domElementManager.elementSelectors.set(elementRef, { 
        selector: tag.toLowerCase(), 
        contextRef: null 
      });
      
      return elementRef;
    } catch (error) {
      throw new Error(`DOM_CREATE_ELEMENT failed: ${error.message}`);
    }
  },
  
  'DOM_CREATE_TEXT': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_CREATE_TEXT requires DOM Element Manager (browser only)');
    }
    
    const text = params.text || '';
    
    try {
      const textNode = document.createTextNode(text);
      
      const elementRef = `dom_element_${this.domElementManager.nextElementId++}`;
      this.domElementManager.elementCache.set(elementRef, textNode);
      this.domElementManager.elementSelectors.set(elementRef, { 
        selector: '#text', 
        contextRef: null 
      });
      
      return elementRef;
    } catch (error) {
      throw new Error(`DOM_CREATE_TEXT failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_APPEND': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_APPEND requires DOM Element Manager (browser only)');
    }
    
    const parent = params.parent;
    const child = params.child;
    
    if (!parent || !child) {
      throw new Error('DOM_ELEMENT_APPEND requires parent and child parameters');
    }
    
    try {
      const parentElem = this.domElementManager.getElementFromRef(parent);
      const childElem = this.domElementManager.getElementFromRef(child);
      
      parentElem.appendChild(childElem);
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_APPEND failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_PREPEND': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_PREPEND requires DOM Element Manager (browser only)');
    }
    
    const parent = params.parent;
    const child = params.child;
    
    if (!parent || !child) {
      throw new Error('DOM_ELEMENT_PREPEND requires parent and child parameters');
    }
    
    try {
      const parentElem = this.domElementManager.getElementFromRef(parent);
      const childElem = this.domElementManager.getElementFromRef(child);
      
      parentElem.insertBefore(childElem, parentElem.firstChild);
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_PREPEND failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_INSERT_BEFORE': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_INSERT_BEFORE requires DOM Element Manager (browser only)');
    }
    
    const reference = params.reference;
    const new_element = params.new_element;
    
    if (!reference || !new_element) {
      throw new Error('DOM_ELEMENT_INSERT_BEFORE requires reference and new_element parameters');
    }
    
    try {
      const referenceElem = this.domElementManager.getElementFromRef(reference);
      const newElem = this.domElementManager.getElementFromRef(new_element);
      
      if (!referenceElem.parentNode) {
        throw new Error('Reference element has no parent');
      }
      
      referenceElem.parentNode.insertBefore(newElem, referenceElem);
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_INSERT_BEFORE failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_INSERT_AFTER': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_INSERT_AFTER requires DOM Element Manager (browser only)');
    }
    
    const reference = params.reference;
    const new_element = params.new_element;
    
    if (!reference || !new_element) {
      throw new Error('DOM_ELEMENT_INSERT_AFTER requires reference and new_element parameters');
    }
    
    try {
      const referenceElem = this.domElementManager.getElementFromRef(reference);
      const newElem = this.domElementManager.getElementFromRef(new_element);
      
      if (!referenceElem.parentNode) {
        throw new Error('Reference element has no parent');
      }
      
      referenceElem.parentNode.insertBefore(newElem, referenceElem.nextSibling);
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_INSERT_AFTER failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_REMOVE': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_REMOVE requires DOM Element Manager (browser only)');
    }
    
    const element = params.element || params;
    if (!element) {
      throw new Error('DOM_ELEMENT_REMOVE requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      
      if (!elem.parentNode) {
        throw new Error('Element has no parent to remove from');
      }
      
      elem.parentNode.removeChild(elem);
      
      // Clean up from cache
      this.domElementManager.elementCache.delete(element);
      this.domElementManager.elementSelectors.delete(element);
      
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_REMOVE failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_REPLACE': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_REPLACE requires DOM Element Manager (browser only)');
    }
    
    const old_element = params.old_element;
    const new_element = params.new_element;
    
    if (!old_element || !new_element) {
      throw new Error('DOM_ELEMENT_REPLACE requires old_element and new_element parameters');
    }
    
    try {
      const oldElem = this.domElementManager.getElementFromRef(old_element);
      const newElem = this.domElementManager.getElementFromRef(new_element);
      
      if (!oldElem.parentNode) {
        throw new Error('Old element has no parent to replace within');
      }
      
      oldElem.parentNode.replaceChild(newElem, oldElem);
      
      // Clean up old element from cache
      this.domElementManager.elementCache.delete(old_element);
      this.domElementManager.elementSelectors.delete(old_element);
      
      return true;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_REPLACE failed: ${error.message}`);
    }
  },
  
  'DOM_ELEMENT_CLONE': function(params) {
    if (!this.domElementManager) {
      throw new Error('DOM_ELEMENT_CLONE requires DOM Element Manager (browser only)');
    }
    
    const element = params.element;
    const deep = params.deep === 'true' || params.deep === true;
    
    if (!element) {
      throw new Error('DOM_ELEMENT_CLONE requires an element parameter');
    }
    
    try {
      const elem = this.domElementManager.getElementFromRef(element);
      const cloned = elem.cloneNode(deep);
      
      const clonedRef = `dom_element_${this.domElementManager.nextElementId++}`;
      this.domElementManager.elementCache.set(clonedRef, cloned);
      this.domElementManager.elementSelectors.set(clonedRef, { 
        selector: cloned.tagName ? cloned.tagName.toLowerCase() : '#text', 
        contextRef: null 
      });
      
      return clonedRef;
    } catch (error) {
      throw new Error(`DOM_ELEMENT_CLONE failed: ${error.message}`);
    }
  }

};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { domFunctions };
} else if (typeof window !== 'undefined') {
  window.domFunctions = domFunctions;
}