$ export ANTHROPIC_API_KEY=redacted && ./core/rexx published_module_tests/test-claude-address.rexx 

(or change ./core/rexx for ./bin/rexx after doing ./make_binary.sh)

```
[INFO] RexxJS Script Runner starting...
[INFO] Script: published_module_tests/test-claude-address.rexx

🧪 Testing Published Module: org.rexxjs/claude-address
✓ /home/paul/scm/RexxJS/extras/addresses/anthropic-ai/claude/src/claude-address.js loaded with 0 dependencies
✓ Module loaded successfully

Test 1: Send message to Claude using heredoc
(Note: Requires ANTHROPIC_API_KEY environment variable)
Get API key from: https://console.anthropic.com/settings/keys

✓ Claude responded: According to The Hitchhiker's Guide to the Galaxy by Douglas Adams, the meaning of life, 
the universe, and everything is 42.

Test 2: Follow-up question with conversation context

✓ Claude responded: The answer "42" appears in "The Hitchhiker's Guide to the Galaxy" (1979), the first book 
in Adams' five-book trilogy (yes, he called it a trilogy despite having five books), where a supercomputer 
called Deep Thought calculates this as the answer to "the Ultimate Question of Life, the Universe, and 
Everything" after thinking about it for 7.5 million years.

Test 3: Close conversation and start fresh

✓ Conversation closed

Test 4: New conversation with custom system prompt

✓ Claude responded: Arr! That's a fine question, ye landlubber! I'm particularly fond of the deep navy blue 
of the ocean depths - the same color ye spot when ye're sailing on calm waters in the middle of the vast sea. 
It reminds me of countless voyages across the seven seas! Though I must say, the crimson red of a glorious 
sunset over the starboard bow also sets me heart a-flutter. Those be the colors that speak to any true 
seafaring soul!

Test 5: Verify conversation context was reset

✓ Context was properly reset - Claude doesn't remember the Douglas Adams conversation

🎉 All tests passed for org.rexxjs/claude-address!
```
