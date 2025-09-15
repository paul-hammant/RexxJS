# Gemini Pro ADDRESS Target

A REXX ADDRESS target that provides seamless integration with Google's Gemini Pro API, enabling powerful AI-powered text generation and conversation capabilities within REXX scripts.

## Setup

1.  **Get an API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

2.  **Set API Key**: Make the API key available as an environment variable.
    ```bash
    export GEMINI_API_KEY="your-api-key-here"
    ```

3.  **Load in REXX**: Use the `REQUIRE` statement to load the address handler.
    ```rexx
    REQUIRE "gemini-pro-address"
    ```

## Usage

### Basic Conversation

```rexx
/* Start a session with a system role */
ADDRESS "gemini-pro"
"SYSTEM ROLE You are a helpful and friendly assistant."
chat_id = result

/* Send a message to the session */
"CHAT" chat_id "TEXT 'Hello! Can you write a short poem about REXX?'"
response = result
SAY response

/* Continue the conversation */
"CHAT" chat_id "TEXT 'That was great! What is the capital of France?'"
SAY result

/* Close the session when done */
"END SESSION" chat_id
```

## Command Reference

- `"SYSTEM ROLE <prompt>"`
  - Starts a new conversation session with a defined system-level instruction.
  - Returns a unique `session ID` in the `RESULT` variable.

- `"CHAT <id> TEXT '<message>'"`
  - Sends a message to an existing session, identified by its `<id>`.
  - Returns the model's text response in `RESULT`.

- `"END SESSION <id>"`
  - Closes a chat session and releases its resources.

- `"STATUS"`
  - Retrieves the current status of the service, including the number of active sessions.

## Features

- **Multi-session support**: Manage multiple concurrent conversations.
- **Session persistence**: Sessions maintain conversation context automatically.
- **Queue integration**: Detailed information like token usage is pushed to the REXX queue.
- **Simple and consistent**: Follows the same command structure as other AI address handlers.

## Environment Support

- **Node.js**: Full functionality using the native `fetch` API (Node.js 18+).
- **Browser**: Works with the browser's native `fetch` API.
- **Security**: The API key is read from the environment and is not exposed in your scripts.
