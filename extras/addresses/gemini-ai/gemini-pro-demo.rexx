// Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License

/*
 * Demo script for the CHECKPOINT-based Gemini Pro ADDRESS handler.
 */

SAY "--- Starting Gemini Pro CHECKPOINT Demo ---"

/* The address handler should be loaded by the environment. */

/* Start a session */
SAY "Starting a new session..."
CHECKPOINT OPERATION="START_SESSION" PARAMS=[system: "You are a REXX programming expert."]

IF checkpointStatus <> "done" THEN DO
    SAY "Failed to start session:" checkpointError
    EXIT 1
END
chat_id = checkpointResult.sessionId
SAY "Session started with ID:" chat_id

/* Send a message */
SAY "Sending a message..."
CHECKPOINT OPERATION="CHAT_MESSAGE" PARAMS=[sessionId: chat_id, message: "What are the main differences between classic REXX and modern implementations?"]

IF checkpointStatus <> "done" THEN DO
    SAY "Failed to send message:" checkpointError
    CHECKPOINT OPERATION="END_SESSION" PARAMS=[sessionId: chat_id]
    EXIT 1
END

response = checkpointResult.response
SAY "Gemini Pro says:"
SAY "----------------"
SAY response
SAY "----------------"

/* End the session */
SAY "Ending session..."
CHECKPOINT OPERATION="END_SESSION" PARAMS=[sessionId: chat_id]

IF checkpointStatus = "done" THEN
    SAY "Session" chat_id "ended successfully."
ELSE
    SAY "Error ending session:" checkpointError

SAY "--- Gemini Pro Demo Finished ---"
EXIT 0
