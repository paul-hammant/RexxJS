/**
 * DOM Element Manager Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const DOMElementManager = require('../src/dom-element-manager');
const { JSDOM } = require('jsdom');

describe('DOMElementManager', () => {
  let dom;
  let domElementManager;
  let container;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <div id="container">
        <button id="button1" class="btn">Button 1</button>
        <button id="button2" class="btn">Button 2</button>
        <div id="div1">
          <span id="span1">Span 1</span>
        </div>
        <input type="text" id="input1" value="initial value" />
      </div>
    `);
    global.document = dom.window.document;
    global.window = dom.window;
    global.Event = dom.window.Event;
    container = document.querySelector('#container');
    domElementManager = new DOMElementManager();
  });

  afterEach(() => {
    domElementManager.clearAll();
    global.document = undefined;
    global.window = undefined;
    global.Event = undefined;
  });

  // Tests will go here
  describe('getElement', () => {
    it('should get an element and return a reference', () => {
      const buttonRef = domElementManager.getElement('#button1');
      expect(buttonRef).toMatch(/^dom_element_\d+$/);
      const button = domElementManager.getElementFromRef(buttonRef);
      expect(button.id).toBe('button1');
    });

    it('should throw an error if element is not found', () => {
      expect(() => {
        domElementManager.getElement('#non-existent');
      }).toThrow('Element not found: #non-existent');
    });
  });

  describe('getAllElements', () => {
    it('should get all elements matching a selector and return references', () => {
      const buttonRefs = domElementManager.getAllElements('.btn');
      expect(buttonRefs).toHaveLength(2);
      expect(buttonRefs[0]).toMatch(/^dom_element_\d+$/);
      expect(buttonRefs[1]).toMatch(/^dom_element_\d+$/);
      const button1 = domElementManager.getElementFromRef(buttonRefs[0]);
      const button2 = domElementManager.getElementFromRef(buttonRefs[1]);
      expect(button1.id).toBe('button1');
      expect(button2.id).toBe('button2');
    });

    it('should return an empty array if no elements are found', () => {
      const refs = domElementManager.getAllElements('.non-existent');
      expect(refs).toHaveLength(0);
    });
  });

  describe('queryElement', () => {
    it('should query for a child element within a parent', () => {
      const divRef = domElementManager.getElement('#div1');
      const spanRef = domElementManager.queryElement(divRef, '#span1');
      expect(spanRef).toMatch(/^dom_element_\d+$/);
      const span = domElementManager.getElementFromRef(spanRef);
      expect(span.id).toBe('span1');
    });

    it('should throw an error if child element is not found', () => {
      const divRef = domElementManager.getElement('#div1');
      expect(() => {
        domElementManager.queryElement(divRef, '#non-existent');
      }).toThrow('Child element not found: #non-existent');
    });
  });

  describe('isStale', () => {
    it('should return false for a valid element', () => {
      const buttonRef = domElementManager.getElement('#button1');
      expect(domElementManager.isStale(buttonRef)).toBe(false);
    });

    it('should return true for a non-existent element reference', () => {
      expect(domElementManager.isStale('non_existent_ref')).toBe(true);
    });

    it('should return true for an element that has been removed from the DOM', () => {
      const buttonRef = domElementManager.getElement('#button1');
      const button = domElementManager.getElementFromRef(buttonRef);
      button.parentNode.removeChild(button);
      expect(domElementManager.isStale(buttonRef)).toBe(true);
    });
  });

  describe('refreshElement', () => {
    it('should refresh a stale element', () => {
      let buttonRef = domElementManager.getElement('#button1');
      const button = domElementManager.getElementFromRef(buttonRef);
      button.parentNode.removeChild(button);
      expect(domElementManager.isStale(buttonRef)).toBe(true);

      // Re-add the element to the DOM
      const newButton = dom.window.document.createElement('button');
      newButton.id = 'button1';
      container.appendChild(newButton);

      buttonRef = domElementManager.refreshElement(buttonRef);
      expect(domElementManager.isStale(buttonRef)).toBe(false);
      const refreshedButton = domElementManager.getElementFromRef(buttonRef);
      expect(refreshedButton).not.toBe(button); // It's a new element
      expect(refreshedButton.id).toBe('button1');
    });

    it('should throw an error if selector is not stored for element', () => {
        expect(() => {
            domElementManager.refreshElement('non_existent_ref');
        }).toThrow('No selector stored for element: non_existent_ref');
    });

    it('should throw an error if element is not found after refresh', () => {
        const buttonRef = domElementManager.getElement('#button1');
        const button = domElementManager.getElementFromRef(buttonRef);
        button.parentNode.removeChild(button);
        expect(() => {
            domElementManager.refreshElement(buttonRef);
        }).toThrow('Element not found after refresh: #button1');
    });
  });

  describe('getElementFromRef', () => {
    it('should return the element for a valid reference', () => {
      const buttonRef = domElementManager.getElement('#button1');
      const button = domElementManager.getElementFromRef(buttonRef);
      expect(button.id).toBe('button1');
    });

    it('should throw an error for a non-existent reference', () => {
      expect(() => {
        domElementManager.getElementFromRef('non_existent_ref');
      }).toThrow('Element reference not found: non_existent_ref');
    });

    it('should throw a stale element error for a stale element', () => {
      const buttonRef = domElementManager.getElement('#button1');
      const button = domElementManager.getElementFromRef(buttonRef);
      button.parentNode.removeChild(button);
      expect(() => {
        domElementManager.getElementFromRef(buttonRef);
      }).toThrow('STALE_ELEMENT: Element is not attached to the DOM');
    });
  });

  describe('DOM Element Operations', () => {
    it('clickElement should click an element', async () => {
      const buttonRef = domElementManager.getElement('#button1');
      const button = domElementManager.getElementFromRef(buttonRef);
      let clicked = false;
      button.addEventListener('click', () => {
        clicked = true;
      });
      await domElementManager.clickElement(buttonRef);
      expect(clicked).toBe(true);
    });

    it('typeInElement should type text into an input element', async () => {
      const inputRef = domElementManager.getElement('#input1');
      await domElementManager.typeInElement(inputRef, 'new value');
      const input = domElementManager.getElementFromRef(inputRef);
      expect(input.value).toBe('new value');
    });

    it('clearElement should clear the value of an input element', async () => {
      const inputRef = domElementManager.getElement('#input1');
      await domElementManager.clearElement(inputRef);
      const input = domElementManager.getElementFromRef(inputRef);
      expect(input.value).toBe('');
    });

    it('getElementText should get the text content of an element', async () => {
      const buttonRef = domElementManager.getElement('#button1');
      const text = await domElementManager.getElementText(buttonRef);
      expect(text).toBe('Button 1');
    });

    it('getElementAttribute should get an attribute of an element', async () => {
      const buttonRef = domElementManager.getElement('#button1');
      const id = await domElementManager.getElementAttribute(buttonRef, 'id');
      expect(id).toBe('button1');
    });

    it('setElementAttribute should set an attribute of an element', async () => {
      const buttonRef = domElementManager.getElement('#button1');
      await domElementManager.setElementAttribute(buttonRef, 'data-test', 'test-value');
      const button = domElementManager.getElementFromRef(buttonRef);
      expect(button.getAttribute('data-test')).toBe('test-value');
    });

    it('isElementVisible should return true for a visible element', async () => {
        const buttonRef = domElementManager.getElement('#button1');
        const button = domElementManager.getElementFromRef(buttonRef);
        // JSDOM does not support offsetParent, so we mock it.
        Object.defineProperty(button, 'offsetParent', {
          get: () => document.body,
        });
        const isVisible = await domElementManager.isElementVisible(buttonRef);
        expect(isVisible).toBe(true);
    });

    it('isElementVisible should return false for a hidden element', async () => {
        const buttonRef = domElementManager.getElement('#button1');
        const button = domElementManager.getElementFromRef(buttonRef);
        button.style.display = 'none';
        const isVisible = await domElementManager.isElementVisible(buttonRef);
        expect(isVisible).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('setConfig should update the configuration', () => {
      domElementManager.setConfig({ debug: true });
      expect(domElementManager.config.debug).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should clear all stored elements and selectors', () => {
      domElementManager.getElement('#button1');
      domElementManager.getElement('#button2');
      domElementManager.clearAll();
      expect(domElementManager.elementSelectors.size).toBe(0);
      expect(domElementManager.elementCache.size).toBe(0);
      expect(domElementManager.nextElementId).toBe(1);
    });
  });
});
