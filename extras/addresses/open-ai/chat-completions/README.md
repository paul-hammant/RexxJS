# OpenAI Chat Completions Address Target for REXX

This package provides a REXX `ADDRESS` target for interacting with the OpenAI Chat Completions API.

**Note:** This implementation is currently a placeholder. The core logic for making API calls needs to be completed.

## Installation

This package is intended to be used within a REXX environment that supports the `CHECKPOINT` mechanism.

## Usage

Once properly configured, you can use this address target from a REXX script like this:

```rexx
/* REXX Example */
SAY "Calling OpenAI Chat Completions API..."

/* The CHECKPOINT command pauses the script and sends a request to the host environment */
CHECKPOINT OPERATION="CHAT_COMPLETION" PARAMS=[
    "model": "gpt-4",
    "messages": [
        ["role": "system", "content": "You are a helpful assistant."],
        ["role": "user", "content": "Hello!"]
    ]
]

/* The script resumes here after the host environment sends a 'checkpoint-response' */
IF checkpointStatus = "success" THEN DO
    SAY "Response from OpenAI:"
    SAY checkpointResult.choices.1.message.content
END
ELSE DO
    SAY "Error calling OpenAI:" checkpointError
END
```

## Configuration

An `OPENAI_API_KEY` environment variable must be available to the host environment that is making the API calls.

## Implementation Details

This address target uses the `CHECKPOINT` pattern. The REXX script does not block on a synchronous API call. Instead, it sends a `checkpoint-request` to the host environment and waits for a `checkpoint-response`. The host environment is responsible for:

1.  Listening for `checkpoint-request` messages.
2.  Making the actual API call to OpenAI.
3.  Sending a `checkpoint-response` message back to the REXX interpreter when the API call is complete.
