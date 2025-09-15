/**
 * DOM Functions Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { domFunctions } = require('../src/dom-functions');
const { JSDOM } = require('jsdom');

describe('DOM Functions', () => {
  let dom;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <div id="container">
        <button id="button1" class="btn">Button 1</button>
        <input type="text" id="input1" value="initial value" />
        <form id="form1">
          <input type="text" name="field1" value="value1" />
        </form>
        <select id="select1">
          <option value="opt1">Option 1</option>
          <option value="opt2">Option 2</option>
        </select>
      </div>
    `);
    global.document = dom.window.document;
    global.window = dom.window;
    global.Event = dom.window.Event;
    global.FormData = dom.window.FormData;
  });

  afterEach(() => {
    global.document = undefined;
    global.window = undefined;
    global.Event = undefined;
    global.FormData = undefined;
  });

  describe('QUERY', () => {
    it('should check if an element exists', () => {
      expect(domFunctions.QUERY({ selector: '#button1' })).toBe(true);
      expect(domFunctions.QUERY({ selector: '#non-existent' })).toBe(false);
    });

    it('should count the number of elements', () => {
      expect(domFunctions.QUERY({ selector: '.btn', operation: 'count' })).toBe(1);
    });

    it('should get the text content of an element', () => {
      expect(domFunctions.QUERY({ selector: '#button1', operation: 'text' })).toBe('Button 1');
    });

    it('should get the value of an input element', () => {
      expect(domFunctions.QUERY({ selector: '#input1', operation: 'value' })).toBe('initial value');
    });

    it('should set the value of an input element', () => {
      domFunctions.QUERY({ selector: '#input1', operation: 'value', value: 'new value' });
      expect(document.querySelector('#input1').value).toBe('new value');
    });

    it('should get an attribute of an element', () => {
      expect(domFunctions.QUERY({ selector: '#button1', operation: 'attribute', attribute: 'id' })).toBe('button1');
    });

    it('should check if an element has a class', () => {
      expect(domFunctions.QUERY({ selector: '#button1', operation: 'has_class', class: 'btn' })).toBe(true);
    });

    it('should serialize a form', () => {
      const result = domFunctions.QUERY({ selector: '#form1', operation: 'serialize' });
      expect(JSON.parse(result)).toEqual({ field1: 'value1' });
    });

    it('should get the name of an element', () => {
      expect(domFunctions.QUERY({ selector: '#form1', operation: 'name' })).toBe(''); // form has no name
      document.querySelector('#input1').name = 'test-input';
      expect(domFunctions.QUERY({ selector: '#input1', operation: 'name' })).toBe('test-input');
    });

    it('should get the id of an element', () => {
      expect(domFunctions.QUERY({ selector: '.btn', operation: 'id' })).toBe('button1');
    });

    it('should get the class of an element', () => {
      expect(domFunctions.QUERY({ selector: '#button1', operation: 'class' })).toBe('btn');
    });

    it('should get a dataset attribute of an element', () => {
      document.querySelector('#button1').dataset.test = 'test-value';
      expect(domFunctions.QUERY({ selector: '#button1', operation: 'dataset', attribute: 'test' })).toBe('test-value');
    });

    it('should set a dataset attribute of an element', () => {
      domFunctions.QUERY({ selector: '#button1', operation: 'dataset', attribute: 'test', value: 'new-value' });
      expect(document.querySelector('#button1').dataset.test).toBe('new-value');
    });

    it('should return empty string for dataset of non-existent element', () => {
        expect(domFunctions.QUERY({ selector: '#non-existent', operation: 'dataset', attribute: 'test' })).toBe('');
    });

    it('should return empty string for attribute of non-existent element', () => {
        expect(domFunctions.QUERY({ selector: '#non-existent', operation: 'attribute', attribute: 'id' })).toBe('');
    });

    it('should return empty object for serialize on non-form element', () => {
        expect(domFunctions.QUERY({ selector: '#button1', operation: 'serialize' })).toBe('{}');
    });

    it('should throw error for unknown operation', () => {
        expect(() => {
            domFunctions.QUERY({ selector: '#button1', operation: 'unknown' });
        }).toThrow('Unknown query operation: unknown');
    });

    it('should throw error if selector is missing', () => {
        expect(() => {
            domFunctions.QUERY({ operation: 'exists' });
        }).toThrow('selector parameter is required');
    });

    it('should check if an element is visible', () => {
        const visibleButton = document.createElement('button');
        visibleButton.id = 'visibleButton';
        document.body.appendChild(visibleButton);
        Object.defineProperty(visibleButton, 'offsetParent', {
            get: () => document.body,
        });
        expect(domFunctions.QUERY({ selector: '#visibleButton', operation: 'visible' })).toBe(true);

        const invisibleButton = document.createElement('button');
        invisibleButton.id = 'invisibleButton';
        document.body.appendChild(invisibleButton);
        Object.defineProperty(invisibleButton, 'offsetParent', {
            get: () => null,
        });
        expect(domFunctions.QUERY({ selector: '#invisibleButton', operation: 'visible' })).toBe(false);
    });
  });

  describe('CLICK', () => {
    it('should click an element', () => {
      const button = document.querySelector('#button1');
      let clicked = false;
      button.addEventListener('click', () => {
        clicked = true;
      });
      domFunctions.CLICK({ selector: '#button1' });
      expect(clicked).toBe(true);
    });

    it('should throw an error if element is not found', () => {
        expect(() => {
            domFunctions.CLICK({ selector: '#non-existent' });
        }).toThrow('Element not found: #non-existent');
    });
  });

  describe('TYPE', () => {
    it('should type text into an input element', () => {
      domFunctions.TYPE({ selector: '#input1', text: 'new value' });
      expect(document.querySelector('#input1').value).toBe('new value');
    });
  });

  describe('SET', () => {
    it('should set a property of an element', () => {
      domFunctions.SET({ selector: '#button1', property: 'disabled', value: true });
      expect(document.querySelector('#button1').disabled).toBe(true);
    });
  });

  describe('Class manipulation', () => {
    it('ADD_CLASS should add a class to an element', () => {
      domFunctions.ADD_CLASS({ selector: '#button1', class: 'new-class' });
      expect(document.querySelector('#button1').classList.contains('new-class')).toBe(true);
    });

    it('REMOVE_CLASS should remove a class from an element', () => {
      document.querySelector('#button1').classList.add('new-class');
      domFunctions.REMOVE_CLASS({ selector: '#button1', class: 'new-class' });
      expect(document.querySelector('#button1').classList.contains('new-class')).toBe(false);
    });
  });

  describe('SET_STYLE', () => {
    it('should set a style property of an element', () => {
      domFunctions.SET_STYLE({ selector: '#button1', property: 'color', value: 'red' });
      expect(document.querySelector('#button1').style.color).toBe('red');
    });
  });

  describe('WAIT_FOR', () => {
    it('should wait for an element to appear', async () => {
        const promise = domFunctions.WAIT_FOR({ selector: '#new-element', timeout: 100 });
        setTimeout(() => {
            const newElement = document.createElement('div');
            newElement.id = 'new-element';
            Object.defineProperty(newElement, 'offsetParent', {
                get: () => document.body
            });
            document.body.appendChild(newElement);
        }, 50);
        await expect(promise).resolves.toBe(true);
    });

    it('should time out if element does not appear', async () => {
        await expect(domFunctions.WAIT_FOR({ selector: '#new-element', timeout: 100 })).resolves.toBe(false);
    });
  });

  describe('WAIT', () => {
    it('should wait for a specified amount of time', async () => {
      const start = Date.now();
      await domFunctions.WAIT({ milliseconds: 100 });
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });

  describe('SELECT_OPTION', () => {
    it('should select an option in a select element', () => {
      domFunctions.SELECT_OPTION({ selector: '#select1', value: 'opt2' });
      expect(document.querySelector('#select1').value).toBe('opt2');
    });
  });

  describe('SLEEP', () => {
    it('should sleep for a specified amount of time', async () => {
      const start = Date.now();
      await domFunctions.SLEEP(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });
});
