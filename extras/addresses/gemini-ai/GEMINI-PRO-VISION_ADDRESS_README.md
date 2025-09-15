# Gemini Pro Vision ADDRESS Target

A REXX ADDRESS target that provides seamless integration with Google's Gemini Pro Vision API, enabling powerful **multimodal (text and image)** analysis and conversation within REXX scripts.

## Setup

1.  **Get an API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

2.  **Set API Key**: Make the API key available as an environment variable.
    ```bash
    export GEMINI_API_KEY="your-api-key-here"
    ```

3.  **Load in REXX**: Use the `REQUIRE` statement to load the address handler.
    ```rexx
    REQUIRE "gemini-pro-vision-address"
    ```

## Usage

### Text and Image Conversation

The `gemini-pro-vision` handler introduces a new `IMAGE` keyword to the `CHAT` command. You can provide a public URL to an image or a base64-encoded data URI.

```rexx
/* Start a session with a system role */
ADDRESS "gemini-pro-vision"
"SYSTEM ROLE You are an expert at analyzing images and describing them."
chat_id = result

/* Send a message with an image from a URL */
image_url = 'https://storage.googleapis.com/generative-ai-downloads/images/scones.jpg'
"CHAT" chat_id "TEXT 'What is in this picture?' IMAGE '"image_url"'"
response = result
SAY "Response for URL image: " response

/* You can also send a base64-encoded image */
/* (Assuming 'base64_image_data' holds the data URI string) */
/* "CHAT" chat_id "TEXT 'Describe this image.' IMAGE '"base64_image_data"'" */
/* SAY "Response for base64 image: " result */

/* Close the session when done */
"END SESSION" chat_id
```

## Command Reference

- `"SYSTEM ROLE <prompt>"`
  - Starts a new conversation session with a defined system-level instruction.
  - Returns a unique `session ID` in the `RESULT` variable.

- `"CHAT <id> TEXT '<message>'"`
  - Sends a text-only message to an existing session.
  - Returns the model's text response in `RESULT`.

- `"CHAT <id> TEXT '<message>' IMAGE '<url_or_base64>'"`
  - Sends a message and an image to an existing session for multimodal analysis.
  - The image can be a publicly accessible URL or a `data:image/...;base64,...` string.
  - Returns the model's text response in `RESULT`.

- `"END SESSION <id>"`
  - Closes a chat session and releases its resources.

- `"STATUS"`
  - Retrieves the current status of the service.

## Features

- **Multimodal Analysis**: Send both text and images in the same prompt.
- **URL and Base64 Support**: Flexible image input options.
- **Multi-session support**: Manage multiple concurrent conversations.
- **Session persistence**: Sessions maintain conversation context automatically.

## Environment Support

- **Node.js**: Full functionality using the native `fetch` API (Node.js 18+).
- **Browser**: Works with the browser's native `fetch` API.
- **Security**: The API key is read from the environment and is not exposed in your scripts.
