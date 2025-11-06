/* Test Rexx-over-wire connection to Etch-A-Sketch */

SAY "Testing Rexx-A-Sketch control bus connection..."
SAY ""

-- Register the endpoint
ADDRESS "http://localhost:8084/api/etch" AUTH "dev-token-12345" AS ETCH

-- Get current position
LET pos = "GET_POSITION"
SAY "Current position: " || pos

-- Clear canvas
"CLEAR"
SAY "Canvas cleared"

-- Draw a simple square
SAY "Drawing a square..."
"PEN_DOWN"
"MOVE 100 0"
"MOVE 0 100"
"MOVE -100 0"
"MOVE 0 -100"
"PEN_UP"

SAY ""
SAY "Test complete! Connection working."

EXIT
