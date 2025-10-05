$ export GEMINI_API_KEY=redacted && ./core/rexx published_module_tests/test-gemini-address.rexx 

(or ./bin/rexx executable after building it)

```
[INFO] RexxJS Script Runner starting...
[INFO] Script: published_module_tests/test-gemini-address.rexx

🧪 Testing Published Module: org.rexxjs/gemini-address
Loading module from registry...
✓ Module loaded successfully

Test 1: Send message to Gemini using heredoc
(Note: Requires GEMINI_API_KEY environment variable)
Get API key from: https://aistudio.google.com/app/apikey

✓ Gemini responded: According to Douglas Adams, the meaning of life is "42" as discovered by the supercomputer 
Deep Thought after millions of years of computation, though the question itself remains unknown.

Test 2: Follow-up question with conversation context

✓ Gemini responded: Douglas Adams wrote about the meaning of life as "42" in his book *The Hitchhiker's Guide to 
the Galaxy*.

Test 3: Close conversation and start fresh

✓ Conversation closed

Test 4: New conversation with custom system prompt

✓ Gemini responded: Shiver me timbers, ye be askin' a fair question! My favorite color, ye ask? It be the deep, 
mysterious blue of the **uncharted ocean depths**, where the kraken sleeps and mermaids sing. Aye, that be the 
hue that stirs me pirate soul! It reminds me of the vast unknown, the promise of treasure, and the thrill of 
adventure!

Test 5: Verify conversation context was reset

✓ Context was properly reset - Gemini doesn't remember the Douglas Adams conversation

🎉 All tests passed for org.rexxjs/gemini-address!
```
