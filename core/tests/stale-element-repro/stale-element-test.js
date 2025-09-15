/**
 * Pure JavaScript test to reproduce stale element scenarios
 * Similar to what happens in Selenium WebDriver
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

class StaleElementTester {
  constructor() {
    this.elementRefs = new Map();
    this.testResults = [];
  }

  // Simulate getting an element reference (like Selenium's findElement)
  getElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    // Store a "reference" to the element (simulating WebDriver's element ID)
    const refId = `element_${Date.now()}_${Math.random()}`;
    this.elementRefs.set(refId, {
      element: element,
      selector: selector,
      timestamp: Date.now()
    });
    
    return refId;
  }

  // Check if element reference is still valid
  isStale(elementRef) {
    const ref = this.elementRefs.get(elementRef);
    if (!ref) return true;
    
    // Check if element is still in the DOM
    return !document.body.contains(ref.element);
  }

  // Simulate clicking an element (like WebDriver's click())
  click(elementRef) {
    const ref = this.elementRefs.get(elementRef);
    if (!ref) {
      throw new Error('StaleElementReferenceException: Element reference is invalid');
    }
    
    if (this.isStale(elementRef)) {
      throw new Error('StaleElementReferenceException: Element is no longer attached to the DOM');
    }
    
    ref.element.click();
    return true;
  }

  // Simulate typing into an element
  type(elementRef, text) {
    const ref = this.elementRefs.get(elementRef);
    if (!ref) {
      throw new Error('StaleElementReferenceException: Element reference is invalid');
    }
    
    if (this.isStale(elementRef)) {
      throw new Error('StaleElementReferenceException: Element is no longer attached to the DOM');
    }
    
    ref.element.value = text;
    ref.element.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  // Get text from element
  getText(elementRef) {
    const ref = this.elementRefs.get(elementRef);
    if (!ref) {
      throw new Error('StaleElementReferenceException: Element reference is invalid');
    }
    
    if (this.isStale(elementRef)) {
      throw new Error('StaleElementReferenceException: Element is no longer attached to the DOM');
    }
    
    return ref.element.textContent || ref.element.value;
  }

  // Run test scenarios
  async runTests() {
    console.log('🧪 Starting Stale Element Tests...\n');
    
    // Test 1: Element becomes stale after parent replacement
    await this.test1_parentReplacement();
    
    // Test 2: Element becomes stale after form rebuild
    await this.test2_formRebuild();
    
    // Test 3: Element becomes stale after AJAX-like update
    await this.test3_ajaxUpdate();
    
    // Test 4: FluentSelenium-style retry pattern
    await this.test4_retryPattern();
    
    // Test 5: Cross-frame staleness (if frames available)
    await this.test5_crossFrame();
    
    this.printResults();
  }

  async test1_parentReplacement() {
    console.log('📝 Test 1: Parent Replacement Causes Staleness');
    
    try {
      // Get reference to password field
      const passwordRef = this.getElement('#cheddarCheeseLoginPassword');
      console.log('  ✓ Got password field reference');
      
      // Verify we can interact with it
      this.type(passwordRef, 'test123');
      console.log('  ✓ Typed into password field');
      
      // Replace the form (making all child elements stale)
      const form = document.getElementById('cheddarCheeseLoginForm');
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      console.log('  ⚠️  Replaced form in DOM');
      
      // Try to interact with stale element
      try {
        this.type(passwordRef, 'this will fail');
        console.log('  ✗ ERROR: Should have thrown StaleElementReferenceException');
        this.testResults.push({ test: 1, passed: false, error: 'Did not detect staleness' });
      } catch (e) {
        if (e.message.includes('StaleElementReferenceException')) {
          console.log('  ✓ Correctly threw StaleElementReferenceException');
          this.testResults.push({ test: 1, passed: true });
        } else {
          throw e;
        }
      }
      
    } catch (e) {
      console.error('  ✗ Test failed:', e.message);
      this.testResults.push({ test: 1, passed: false, error: e.message });
    }
    
    console.log('');
  }

  async test2_formRebuild() {
    console.log('📝 Test 2: Form Rebuild Causes Staleness');
    
    try {
      // Get initial reference
      const passwordRef = this.getElement('#cheddarCheeseLoginPassword');
      console.log('  ✓ Got password field reference');
      
      // Simulate form being rebuilt (common in SPAs)
      const form = document.getElementById('cheddarCheeseLoginForm');
      form.innerHTML = `
        <input id="cheddarCheeseLoginPassword" name="password" 
               alt="Password" title='Password if you plz.'>
        <button type="submit">Login</button>
      `;
      console.log('  ⚠️  Rebuilt form innerHTML');
      
      // Original reference should be stale
      try {
        this.getText(passwordRef);
        console.log('  ✗ ERROR: Should have thrown StaleElementReferenceException');
        this.testResults.push({ test: 2, passed: false, error: 'Did not detect staleness' });
      } catch (e) {
        if (e.message.includes('StaleElementReferenceException')) {
          console.log('  ✓ Correctly detected stale element');
          this.testResults.push({ test: 2, passed: true });
        } else {
          throw e;
        }
      }
      
    } catch (e) {
      console.error('  ✗ Test failed:', e.message);
      this.testResults.push({ test: 2, passed: false, error: e.message });
    }
    
    console.log('');
  }

  async test3_ajaxUpdate() {
    console.log('📝 Test 3: AJAX-like Update Causes Staleness');
    
    try {
      // Add a dynamic element
      const container = document.body;
      const div = document.createElement('div');
      div.id = 'ajaxContent';
      div.innerHTML = '<span id="dynamicText">Original Content</span>';
      container.appendChild(div);
      
      // Get reference to the span
      const spanRef = this.getElement('#dynamicText');
      console.log('  ✓ Got dynamic content reference');
      
      // Simulate AJAX update after delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Replace content (simulating AJAX response)
      document.getElementById('ajaxContent').innerHTML = 
        '<span id="dynamicText">Updated Content</span>';
      console.log('  ⚠️  Simulated AJAX content update');
      
      // Original reference should be stale
      try {
        this.getText(spanRef);
        console.log('  ✗ ERROR: Should have thrown StaleElementReferenceException');
        this.testResults.push({ test: 3, passed: false, error: 'Did not detect staleness' });
      } catch (e) {
        if (e.message.includes('StaleElementReferenceException')) {
          console.log('  ✓ Correctly detected stale element after AJAX update');
          this.testResults.push({ test: 3, passed: true });
        } else {
          throw e;
        }
      }
      
      // Cleanup
      document.getElementById('ajaxContent').remove();
      
    } catch (e) {
      console.error('  ✗ Test failed:', e.message);
      this.testResults.push({ test: 3, passed: false, error: e.message });
    }
    
    console.log('');
  }

  async test4_retryPattern() {
    console.log('📝 Test 4: FluentSelenium-style Retry Pattern');
    
    const retryOperation = async (operation, maxRetries = 3) => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (e) {
          lastError = e;
          if (e.message.includes('StaleElementReferenceException')) {
            console.log(`  ↻ Retry ${attempt}/${maxRetries} after stale element`);
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          }
          throw e;
        }
      }
      throw lastError;
    };
    
    try {
      // Create element that will go stale
      const div = document.createElement('div');
      div.id = 'retryTest';
      div.textContent = 'Retry Test Element';
      document.body.appendChild(div);
      
      let elementRef = this.getElement('#retryTest');
      console.log('  ✓ Got element reference');
      
      // Operation that handles staleness with retry
      const result = await retryOperation(async () => {
        // Make element stale on first attempt
        if (this.isStale(elementRef)) {
          // Re-query the element
          elementRef = this.getElement('#retryTest');
        }
        
        // First attempt: make it stale
        if (!this.isStale(elementRef)) {
          const elem = document.getElementById('retryTest');
          const newElem = elem.cloneNode(true);
          elem.parentNode.replaceChild(newElem, elem);
        }
        
        return this.getText(elementRef);
      });
      
      console.log('  ✓ Retry pattern successfully handled stale element');
      this.testResults.push({ test: 4, passed: true });
      
      // Cleanup
      document.getElementById('retryTest').remove();
      
    } catch (e) {
      console.error('  ✗ Test failed:', e.message);
      this.testResults.push({ test: 4, passed: false, error: e.message });
    }
    
    console.log('');
  }

  async test5_crossFrame() {
    console.log('📝 Test 5: Cross-frame Staleness');
    
    try {
      // Create an iframe
      const iframe = document.createElement('iframe');
      iframe.id = 'testFrame';
      iframe.srcdoc = '<html><body><div id="frameContent">Frame Content</div></body></html>';
      document.body.appendChild(iframe);
      
      // Wait for iframe to load
      await new Promise(resolve => {
        iframe.onload = resolve;
        setTimeout(resolve, 100); // Fallback timeout
      });
      
      console.log('  ✓ Created test iframe');
      
      // Get element from iframe
      const frameDoc = iframe.contentDocument || iframe.contentWindow.document;
      const frameElement = frameDoc.getElementById('frameContent');
      
      // Store reference
      const refId = `frame_element_${Date.now()}`;
      this.elementRefs.set(refId, {
        element: frameElement,
        selector: '#frameContent',
        timestamp: Date.now()
      });
      
      console.log('  ✓ Got reference to element in iframe');
      
      // Navigate iframe (causes all elements to become stale)
      iframe.srcdoc = '<html><body><div id="frameContent">New Frame Content</div></body></html>';
      
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('  ⚠️  Navigated iframe (all elements now stale)');
      
      // Check if element is stale
      if (this.isStale(refId)) {
        console.log('  ✓ Correctly detected cross-frame staleness');
        this.testResults.push({ test: 5, passed: true });
      } else {
        console.log('  ✗ Failed to detect cross-frame staleness');
        this.testResults.push({ test: 5, passed: false, error: 'Did not detect staleness' });
      }
      
      // Cleanup
      iframe.remove();
      
    } catch (e) {
      console.error('  ✗ Test failed:', e.message);
      this.testResults.push({ test: 5, passed: false, error: e.message });
    }
    
    console.log('');
  }

  printResults() {
    console.log('📊 Test Results Summary:');
    console.log('═══════════════════════');
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const message = result.passed ? 'PASSED' : `FAILED: ${result.error}`;
      console.log(`  Test ${result.test}: ${status} ${message}`);
    });
    
    console.log('───────────────────────');
    console.log(`  Total: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Stale element detection working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the results above.');
    }
  }
}

// Run tests when page loads
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Waiting for page setup...');
      setTimeout(() => {
        const tester = new StaleElementTester();
        tester.runTests();
      }, 500);
    });
  } else {
    setTimeout(() => {
      const tester = new StaleElementTester();
      tester.runTests();
    }, 500);
  }
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StaleElementTester;
}