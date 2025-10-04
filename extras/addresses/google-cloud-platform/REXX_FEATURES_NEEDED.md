# RexxJS Features Needed for Enhanced Serverless Development

This document outlines useful features that would improve the RexxJS experience, particularly for serverless and web development use cases.

## 🌐 HTTP/Network Functions

### **1. HTTP Verb Functions (Primary API)**
**Current State:** No built-in HTTP request functionality
**Workaround:** Using `ADDRESS SYSTEM "curl ..."` which is cumbersome

**Proposed HTTP Verb API:**
```rexx
/* GET request */
response = HTTP_GET('https://api.example.com/users')
if response.status = 200 then
  SAY "Users: " response.body

/* POST with JSON data */
json_data = '{"name": "RexxJS", "version": "1.0"}'
response = HTTP_POST('http://localhost:8080/api/create', json_data)
if response.status = 201 then
  SAY "Created: " response.body
else
  SAY "Error: " response.status response.statusText

/* PUT and DELETE */
response = HTTP_PUT('http://localhost:8080/api/update/123', data)
response = HTTP_DELETE('http://localhost:8080/api/delete/123')

/* Headers support */
headers.authorization = 'Bearer token123'
headers.content_type = 'application/json'
response = HTTP_POST('https://api.example.com/secure', data, headers)
```

**Implementation:** Uses JavaScript's native `fetch()` - **no libcurl needed**

**Benefits:**
- ✅ **Verb-based naming** matches HTTP semantics
- ✅ **No external dependencies** - pure JavaScript
- ✅ **Cross-platform** - browser and Node.js
- ✅ **Better error handling** than system calls
- ✅ **Header support** for authentication/content-type

### **3. URL_ENCODE() and URL_DECODE() Functions**
```rexx
encoded = URL_ENCODE('hello world!') /* Returns: hello%20world%21 */
decoded = URL_DECODE('hello%20world%21') /* Returns: hello world! */
```

## 📦 JSON Functions

### **4. JSON_PARSE() and JSON_STRINGIFY() Functions**
**Current State:** Manual string manipulation for JSON
**Workaround:** Complex string parsing or external tools

**Proposed API:**
```rexx
/* Parse JSON string to Rexx compound variable */
json_text = '{"name": "RexxJS", "version": "1.0", "features": ["http", "json"]}'
obj = JSON_PARSE(json_text)
SAY obj.name          /* RexxJS */
SAY obj.version       /* 1.0 */
SAY obj.features.1    /* http */

/* Convert Rexx data to JSON */
data.name = "Hello"
data.active = 1
data.tags.1 = "serverless"
data.tags.2 = "rexx"
json_result = JSON_STRINGIFY(data)
SAY json_result  /* {"name":"Hello","active":1,"tags":["serverless","rexx"]} */
```

## 🛠️ Utility Functions

### **5. BASE64_ENCODE() and BASE64_DECODE() Functions**
```rexx
encoded = BASE64_ENCODE('Hello RexxJS!')
decoded = BASE64_DECODE(encoded)
```

### **6. HASH() Function for Checksums**
```rexx
sha256 = HASH('SHA256', 'Hello World')
md5 = HASH('MD5', 'test data')
```

### **7. UUID() Function**
```rexx
id = UUID()  /* Generate random UUID */
SAY "New ID: " id  /* e.g., 550e8400-e29b-41d4-a716-446655440000 */
```

## 🕐 Date/Time Enhancements

### **8. ISO_DATE() and PARSE_ISO_DATE() Functions**
```rexx
/* Current timestamp in ISO 8601 format */
now = ISO_DATE()  /* 2024-09-28T10:30:00.000Z */

/* Parse ISO date to components */
components = PARSE_ISO_DATE('2024-09-28T10:30:00.000Z')
SAY components.year   /* 2024 */
SAY components.month  /* 09 */
SAY components.day    /* 28 */
```

## 🔧 File System Enhancements

### **9. MKDIR() and RMDIR() Functions**
```rexx
success = MKDIR('/tmp/my-directory')
removed = RMDIR('/tmp/my-directory')
```

### **10. FILE_EXISTS() and DIR_EXISTS() Functions**
```rexx
if FILE_EXISTS('/tmp/config.json') then
  SAY "Config file found"

if DIR_EXISTS('/tmp/workspace') then
  SAY "Workspace directory exists"
```

## 🎯 Priority for Serverless Development

**High Priority:**
1. **HTTP_GET()** / **HTTP_POST()** - Essential for testing serverless functions
2. **JSON_PARSE()** and **JSON_STRINGIFY()** - Critical for API integration
3. **HTTP_PUT()** / **HTTP_DELETE()** - Complete REST API support

**Medium Priority:**
4. **URL_ENCODE()** / **URL_DECODE()** - URL parameter handling
5. **BASE64_ENCODE()** / **BASE64_DECODE()** - Data encoding
6. **UUID()** - Unique identifier generation

**Low Priority:**
7. Enhanced date/time functions
8. File system utilities
9. Hash functions

**Implementation Strategy:**
- **Phase 1:** HTTP verbs + JSON functions (core serverless testing)
- **Phase 2:** Encoding utilities (URL, Base64)
- **Phase 3:** Enhanced utilities (UUID, dates, etc.)

## 💡 Implementation Notes

### JavaScript Integration
Since RexxJS runs on JavaScript engines, HTTP verb functions wrap the native `fetch()` API:

```javascript
// Example implementation for HTTP_GET()
rexx.addBuiltinFunction('HTTP_GET', async (url, headers = {}) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: convertRexxHeaders(headers)
    });
    return {
      status: response.status,
      statusText: response.statusText,
      body: await response.text(),
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return { status: 0, error: error.message };
  }
});

// Example implementation for HTTP_POST()
rexx.addBuiltinFunction('HTTP_POST', async (url, body = '', headers = {}) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: body,
      headers: convertRexxHeaders(headers)
    });
    return {
      status: response.status,
      statusText: response.statusText,
      body: await response.text()
    };
  } catch (error) {
    return { status: 0, error: error.message };
  }
});
```

**No external dependencies** - uses browser/Node.js native `fetch()`

### Backward Compatibility
- All functions should be optional and not break existing code
- Graceful fallbacks when APIs are not available
- Clear error messages when features are missing

## 🎮 Usage Example: Current vs Elegant Approach

### **Current Cumbersome Approach:**
```rexx
/* Current way: Using curl via ADDRESS SYSTEM */
SAY "Testing OpenFaaS function..."
ADDRESS SYSTEM "curl -s -X POST http://localhost:8080/function/hello-world -d 'RexxJS' -o /tmp/curl_test.txt"
if RC = 0 then do
  call lineout '/dev/stdout', "✓ Curl test passed. Response: "
  ADDRESS SYSTEM "cat /tmp/curl_test.txt"
  call sysfiledelete '/tmp/curl_test.txt'
else
  SAY "✗ Curl test failed"
end

/* JSON handling requires manual string manipulation */
json_data = '{"name": "' || name || '", "active": true}'
ADDRESS SYSTEM 'curl -s -X POST http://localhost:8080/api -H "Content-Type: application/json" -d "' || json_data || '" -o /tmp/response.json'
/* Then manually parse the JSON response... */
```

### **Elegant Future Approach:**
```rexx
/* With proposed HTTP verb functions */
SAY "Testing OpenFaaS function..."

/* Simple HTTP test */
response = HTTP_POST('http://localhost:8080/function/hello-world', 'RexxJS')
if response.status = 200 then do
  SAY "✓ Function responded successfully"
  SAY "Response: " response.body
else
  SAY "✗ Function failed: " response.status response.statusText
end

/* JSON API test */
request_data = JSON_STRINGIFY({"name": "RexxJS", "test": true})
response = HTTP_POST('http://localhost:8080/function/api-test', request_data)
result = JSON_PARSE(response.body)
SAY "API returned: " result.message

/* GET request example */
functions = HTTP_GET('http://localhost:8080/system/functions')
if functions.status = 200 then
  SAY "Functions available: " functions.body
```

### **Benefits of Elegant Approach:**
- ✅ **No temporary files** - Direct response handling
- ✅ **No system calls** - Native RexxJS functions
- ✅ **Better error handling** - Structured response objects
- ✅ **JSON integration** - Native parsing and generation
- ✅ **Cross-platform** - Works in browser and Node.js
- ✅ **Type safety** - Proper data structures instead of strings
- ✅ **Cleaner code** - 50% fewer lines, more readable

**See `hello-openfaas-elegant.rexx` for a complete example showing the elegant approach.**

## 📋 Implementation Checklist

**Phase 1: Core HTTP + JSON (Highest Impact)**
- [ ] **HTTP_GET()** - GET request function
- [ ] **HTTP_POST()** - POST request function
- [ ] **HTTP_PUT()** - PUT request function
- [ ] **HTTP_DELETE()** - DELETE request function
- [ ] **JSON_PARSE()** - Parse JSON to Rexx data
- [ ] **JSON_STRINGIFY()** - Convert Rexx data to JSON

**Phase 2: Encoding Utilities**
- [ ] **URL_ENCODE/DECODE()** - URL encoding utilities
- [ ] **BASE64_ENCODE/DECODE()** - Base64 utilities

**Phase 3: Enhanced Utilities**
- [ ] **UUID()** - UUID generation
- [ ] **ISO_DATE()** - ISO 8601 date formatting
- [ ] **FILE_EXISTS()** - File existence check
- [ ] **HASH()** - Checksum generation

**Implementation Notes:**
- All functions use native JavaScript APIs (no external deps)
- HTTP functions wrap `fetch()` with Rexx-friendly response objects
- JSON functions use `JSON.parse()` and `JSON.stringify()`
- Cross-platform support (browser + Node.js)

---

*This document represents wishlist features that would significantly improve RexxJS for modern development workflows, particularly serverless and web API integration.*