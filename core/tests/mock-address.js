/**
 * Mock ADDRESS handler for testing
 * Captures commands sent to it for test verification
 */

class MockAddressHandler {
  constructor() {
    this.calls = [];
    this.responses = [];
    this.defaultResponse = { success: true, operation: 'MOCK_OK' };
  }

  // Set up canned responses for testing
  setResponse(response) {
    this.defaultResponse = response;
  }

  // Queue multiple responses (for testing sequences)
  queueResponses(responses) {
    this.responses = [...responses];
  }

  // Clear call history
  clear() {
    this.calls = [];
    this.responses = [];
  }

  // Get call history for assertions
  getCalls() {
    return this.calls;
  }

  getLastCall() {
    return this.calls[this.calls.length - 1];
  }

  // Main handler function
  async handle(payload, params = {}, context = null) {
    const call = {
      payload,
      params,
      context,
      timestamp: Date.now()
    };
    
    this.calls.push(call);

    // Return queued response if available, otherwise default
    const response = this.responses.length > 0 
      ? this.responses.shift() 
      : this.defaultResponse;

    return response;
  }
}

// Create singleton instance for tests
const mockAddressHandler = new MockAddressHandler();

// Export both the class and singleton
module.exports = {
  MockAddressHandler,
  mockAddressHandler,
  
  // Handler function for ADDRESS target registration
  handleMockAddress: async (payload, params, context) => {
    return await mockAddressHandler.handle(payload, params, context);
  }
};