# Claude ADDRESS Library for RexxJS

This library provides integration with Anthropic's Claude AI assistant for RexxJS through the ADDRESS mechanism, allowing REXX programs to interact with Claude for natural language processing, code generation, analysis, and general AI assistance.

## Quick Start

```rexx
/* Set up your API key first */
REQUIRE "claude-address.js"
ADDRESS CLAUDE
"SYSTEM ROLE You are a helpful REXX programming assistant."
LET response = ask prompt="How do I reverse a string in REXX?"
SAY response.content
```

## Installation

```bash
npm install  # Installs @anthropic-ai/sdk dependency
npm test
```

**Requirements:**
- Anthropic API key (set `ANTHROPIC_API_KEY` environment variable)
- Internet connection for API access

## Setup

### API Key Configuration

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Or set it programmatically:
```rexx
ADDRESS SYSTEM
"export ANTHROPIC_API_KEY=your-key-here"
```

### Get API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Generate an API key
4. Set the `ANTHROPIC_API_KEY` environment variable

## ADDRESS Target: `claude`

Once loaded, this library registers the `claude` ADDRESS target, allowing you to:
- Start chat sessions with Claude
- Send prompts and receive AI responses
- Set system roles and behavior
- Manage conversation context
- Handle different Claude models
- Stream responses for long outputs

## Usage Patterns

### Basic Chat

```rexx
ADDRESS CLAUDE
"SYSTEM ROLE You are a helpful programming tutor."
LET response = ask prompt="Explain recursion in simple terms"
SAY response.content
```

### System Role Configuration

```rexx
ADDRESS CLAUDE
"SYSTEM ROLE You are a REXX language expert who provides concise, accurate code examples."
LET help = ask prompt="Show me a REXX loop example"
SAY help.content
```

### Multi-turn Conversations

```rexx
ADDRESS CLAUDE
"START SESSION"
LET r1 = ask prompt="I'm working on a data processing script"
LET r2 = ask prompt="How can I parse CSV files efficiently?"
LET r3 = ask prompt="What about error handling?"
```

### Method-Style Operations

```rexx
ADDRESS CLAUDE
LET result = chat message="Write a function to calculate fibonacci" model="claude-3-sonnet-20240229"
SAY "Response:" result.content
SAY "Tokens used:" result.usage.total_tokens
```

## Available Methods

### `ask` / `chat`
Send a message to Claude and get a response.

**Parameters:**
- `prompt` / `message` - The message to send to Claude
- `model` - Claude model to use (optional, defaults to claude-3-haiku-20240307)
- `max_tokens` - Maximum tokens in response (optional, default 1000)
- `temperature` - Response creativity 0-1 (optional, default 0.7)

**Returns:** Object with `content`, `usage`, `model`

### `checkpoint`
Create a structured analysis checkpoint with Claude using COMET-style long-polling.

**Parameters:**
- `operation` - Type of analysis: "ANALYZE_CODE", "GENERATE_CODE", "REVIEW_TEXT", or custom
- `code` - Code to analyze (for ANALYZE_CODE operations)
- `text` - Text content (for REVIEW_TEXT or GENERATE_CODE operations)
- `data` - Generic data for custom operations
- `format` - Response format (optional, defaults to "structured")
- `timeout` - Checkpoint timeout in milliseconds (optional, default 30000)

**Returns:** Object with `checkpointId`, `status`, and `timeout`

### `wait_for_checkpoint` / `poll_checkpoint`
Poll a checkpoint for completion using long-polling architecture.

**Parameters:**
- `checkpoint_id` - The checkpoint ID to poll

**Returns:** Object with `status`, `progress`, and `result` when `done: true`

### `complete_checkpoint`
Manually complete a checkpoint (for external collaborators).

**Parameters:**
- `checkpoint_id` - The checkpoint ID to complete
- `result` - The completion result data

**Returns:** Object with completion confirmation

### `system`
Set the system role/behavior for Claude.

**Parameters:**
- `role` - System role description

### `session`
Manage conversation sessions.

**Parameters:**
- `action` - "start", "end", "status"

**Returns:** Session information

### `status`
Get Claude service status and configuration.

**Returns:** Object with connection status, model info, usage stats

## Claude Models

Available models (as of 2024):
- **claude-3-haiku-20240307** - Fast, efficient (default)
- **claude-3-sonnet-20240229** - Balanced performance
- **claude-3-opus-20240229** - Most capable

```rexx
ADDRESS CLAUDE
LET response = ask prompt="Complex analysis task" model="claude-3-opus-20240229"
```

## CHECKPOINT Technology - Structured Collaboration

The Claude ADDRESS library implements the **CHECKPOINT** pattern from CHECKPOINT-TECH.md, enabling structured collaboration with Claude using COMET-style long-polling.

### Code Analysis Example

```rexx
ADDRESS CLAUDE
/* Create analysis checkpoint */
LET sourceCode = "function fibonacci(n) { if (n <= 1) return n; return fibonacci(n-1) + fibonacci(n-2); }"
LET analysisCheckpoint = checkpoint operation="ANALYZE_CODE" code=sourceCode format="structured"

/* COMET-style polling loop */
DO WHILE isDone <> "true"
    LET pollResult = wait_for_checkpoint checkpoint_id=analysisCheckpoint.checkpointId
    SAY "Progress:" pollResult.progress.percentage "%"
    
    IF pollResult.done = "true" THEN DO
        LET isDone = "true"
        SAY "Analysis:" pollResult.result.data.analysis
        SAY "Issues found:" pollResult.result.data.issues.length
        SAY "Quality score:" pollResult.result.data.quality_score
    END
END
```

### Command-Style CHECKPOINT

```rexx
ADDRESS CLAUDE
CHECKPOINT operation="GENERATE_CODE" text="Create an email validation function" format="structured"
/* Returns checkpointId for later polling */
```

### Text Review Example

```rexx
ADDRESS CLAUDE
LET document = "This document may contains some errors."
LET reviewCheckpoint = checkpoint operation="REVIEW_TEXT" text=document

/* Poll until complete */
DO UNTIL reviewResult.done = "true"
    LET reviewResult = wait_for_checkpoint checkpoint_id=reviewCheckpoint.checkpointId
    IF reviewResult.done = "true" THEN DO
        SAY "Grammar issues:" reviewResult.result.data.grammar_issues.length
        SAY "Readability:" reviewResult.result.data.readability
    END
END
```

### External Collaborator Pattern

```rexx
ADDRESS CLAUDE
/* Create checkpoint for external processing */
LET checkpoint = checkpoint operation="CUSTOM_ANALYSIS" data=myData

/* External system can complete it manually */
LET externalResult = '{"analysis": "completed", "score": 0.95}'
LET completion = complete_checkpoint checkpoint_id=checkpoint.checkpointId result=externalResult
```

## Advanced Features

### Structured Output Operations

Supported operation types:
- **ANALYZE_CODE** - Code analysis with issues, suggestions, quality scores
- **GENERATE_CODE** - Code generation with explanations and examples
- **REVIEW_TEXT** - Text analysis with grammar, style, and readability feedback  
- **Custom Operations** - Generic analysis for any content type

### Progress Monitoring

```rexx
ADDRESS CLAUDE
LET checkpoint = checkpoint operation="ANALYZE_CODE" code=myCode
DO WHILE status <> "completed"
    LET poll = wait_for_checkpoint checkpoint_id=checkpoint.checkpointId
    SAY poll.progress.message "(" || poll.progress.percentage || "%)"
    IF poll.status = "error" THEN
        SAY "Error:" poll.error.message
END
```

### Streaming Responses

```rexx
ADDRESS CLAUDE
LET result = stream prompt="Write a long essay about AI" 
/* Handles large responses efficiently */
```

### Token Management

```rexx
ADDRESS CLAUDE
LET response = ask prompt="Summarize this text" max_tokens=500
SAY "Used" response.usage.total_tokens "tokens"
```

### Temperature Control

```rexx
ADDRESS CLAUDE
/* Creative response */
LET creative = ask prompt="Write a poem" temperature=0.9

/* Factual response */  
LET factual = ask prompt="What is 2+2?" temperature=0.1
```

## Error Handling

```rexx
ADDRESS CLAUDE
"SYSTEM ROLE You are a math tutor"
LET response = ask prompt="Solve this equation: x^2 + 5x + 6 = 0"
IF response.error THEN DO
    SAY "API Error:" response.error.message
    IF response.error.type = "authentication_error" THEN
        SAY "Check your ANTHROPIC_API_KEY"
END
```

## Use Cases

### Code Generation

```rexx
ADDRESS CLAUDE
"SYSTEM ROLE You are a REXX programming expert"
LET code = ask prompt="Write a REXX function to validate email addresses"
SAY code.content
```

### Documentation

```rexx
ADDRESS CLAUDE
"SYSTEM ROLE You are a technical writer"
LET docs = ask prompt="Document this function: " || my_function_code
SAY docs.content
```

### Data Analysis

```rexx
ADDRESS CLAUDE
LET analysis = ask prompt="Analyze this CSV data and find trends: " || csv_data
SAY analysis.content
```

### Code Review

```rexx
ADDRESS CLAUDE
"SYSTEM ROLE You are a senior developer doing code review"
LET review = ask prompt="Review this code for bugs and improvements: " || source_code
SAY review.content
```

## REXX Integration

Standard REXX variables are set:
- **RC** - Return code (0 = success)
- **RESULT** - Claude's response content
- **ERRORTEXT** - Error message if request failed

## Testing

Run the test suite:

```bash
npm test
```

Tests include:
- Basic chat functionality
- System role configuration
- Session management
- Error handling
- API key validation
- Model selection

**Note:** Tests work with or without valid API key (mock mode when unavailable).

## Rate Limits and Costs

- Anthropic enforces API rate limits
- Usage is billed by tokens (input + output)
- Monitor usage through the Anthropic Console
- Consider implementing local caching for repeated queries

## Security Notes

- Never commit API keys to version control
- Use environment variables for key management
- Consider implementing usage quotas
- Validate and sanitize prompts from user input
- Be mindful of sensitive data in prompts

## Environment Compatibility

- **Node.js**: Full support with @anthropic-ai/sdk
- **Browser**: Supported with appropriate CORS setup
- **Testing**: Mock responses when API key unavailable

## Best Practices

1. **System Roles**: Set clear, specific system roles
2. **Prompt Engineering**: Be specific and clear in prompts
3. **Error Handling**: Always handle API failures gracefully
4. **Token Management**: Monitor usage to control costs
5. **Context Management**: Use sessions for multi-turn conversations

## Integration

This library integrates with:
- RexxJS core interpreter
- Standard REXX ADDRESS mechanism
- Anthropic Claude API
- REXX variable and error handling systems

Part of the RexxJS extras collection.

## Support

- [Anthropic Documentation](https://docs.anthropic.com/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [RexxJS Documentation](../../../README.md)