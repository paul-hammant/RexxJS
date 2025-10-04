# HTTP Verbs vs Fetch: API Design for RexxJS

## 🎯 The Question: How to Name HTTP Functions?

Should RexxJS use `FETCH()` (JavaScript naming) or `HTTP_GET()` (verb naming)?

## ✅ **Answer: HTTP Verbs Win**

### **Why HTTP_GET() is Better than FETCH()**

| Aspect | `FETCH()` | `HTTP_GET()` |
|--------|-----------|--------------|
| **Clarity** | `FETCH(url, 'GET')` | `HTTP_GET(url)` |
| **Semantics** | JavaScript-centric | HTTP protocol-centric |
| **Learning** | Need to know methods | Method is in function name |
| **Autocomplete** | One function, many variants | Separate functions for each verb |
| **Readability** | `FETCH(url, 'POST', data)` | `HTTP_POST(url, data)` |

### **Rexx Philosophy: Verb-Action Naming**
```rexx
/* Rexx style - action is clear from function name */
data = HTTP_GET('https://api.example.com/users')
result = HTTP_POST('https://api.example.com/create', payload)
success = HTTP_PUT('https://api.example.com/update/123', data)
deleted = HTTP_DELETE('https://api.example.com/delete/123')

/* vs JavaScript style - action buried in parameter */
data = FETCH('https://api.example.com/users', 'GET')
result = FETCH('https://api.example.com/create', 'POST', payload)
success = FETCH('https://api.example.com/update/123', 'PUT', data)
deleted = FETCH('https://api.example.com/delete/123', 'DELETE')
```

## 🔧 Implementation Strategy

### **Under the Hood: Native JavaScript fetch()**
```javascript
// All HTTP verb functions wrap the same native fetch()
rexx.addBuiltinFunction('HTTP_GET', async (url, headers = {}) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: convertRexxHeaders(headers)
  });
  return formatRexxResponse(response);
});

rexx.addBuiltinFunction('HTTP_POST', async (url, body = '', headers = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    body,
    headers: convertRexxHeaders(headers)
  });
  return formatRexxResponse(response);
});
```

### **No External Dependencies**
- ✅ Uses browser/Node.js native `fetch()`
- ✅ No libcurl, no additional packages
- ✅ Cross-platform compatibility
- ✅ Async/await support built-in

## 🎮 Usage Comparison

### **Current (Cumbersome)**
```rexx
ADDRESS SYSTEM "curl -s -X POST http://localhost:8080/function/hello -d 'data' -o /tmp/response.txt"
if RC = 0 then do
  ADDRESS SYSTEM "cat /tmp/response.txt"
  call sysfiledelete '/tmp/response.txt'
```

### **Fetch Style (JavaScript-ish)**
```rexx
response = FETCH('http://localhost:8080/function/hello', 'POST', 'data')
if response.ok then
  SAY response.body
```

### **HTTP Verb Style (Rexx-ish)**
```rexx
response = HTTP_POST('http://localhost:8080/function/hello', 'data')
if response.status = 200 then
  SAY response.body
```

## 🏆 Winner: HTTP Verbs

### **Advantages:**
1. **Self-documenting** - Function name tells you the HTTP method
2. **Rexx-friendly** - Matches Rexx's verb-action philosophy
3. **Type-safe** - No string method parameters to get wrong
4. **IDE-friendly** - Separate functions for autocomplete
5. **REST-aware** - Maps directly to REST API semantics

### **Complete API Proposal:**
```rexx
/* Core HTTP verbs */
response = HTTP_GET(url [, headers])
response = HTTP_POST(url, body [, headers])
response = HTTP_PUT(url, body [, headers])
response = HTTP_DELETE(url [, headers])

/* Response object */
response.status      /* HTTP status code (200, 404, etc.) */
response.statusText  /* HTTP status text ("OK", "Not Found") */
response.body        /* Response body as string */
response.headers     /* Response headers as compound variable */
```

## 🎯 Conclusion

**HTTP verbs make RexxJS feel like Rexx, not like JavaScript.**

The goal is elegant, readable Rexx code that happens to use JavaScript under the hood, not JavaScript code that happens to run in Rexx syntax.

---

*This API design makes serverless testing and web development much more natural for Rexx developers.*