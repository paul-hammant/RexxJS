/* Custom drawing example - demonstrates Rexx control over Etch-A-Sketch */

SAY "Custom drawing demo"
SAY ""

-- Register the Rexx-A-Sketch control endpoint
ADDRESS "http://localhost:8084/api/etch" AUTH "dev-token-12345" AS ETCH

-- Clear canvas
"CLEAR"

-- Draw a house
SAY "Drawing a house..."

-- Square base
"MOVE_TO 300 300"
"PEN_DOWN"
"MOVE 100 0"
"MOVE 0 -100"
"MOVE -100 0"
"MOVE 0 100"

-- Roof (triangle)
"PEN_UP"
"MOVE_TO 300 200"
"PEN_DOWN"
"MOVE 50 -50"
"MOVE 50 50"
"MOVE -100 0"

-- Door
"PEN_UP"
"MOVE_TO 340 300"
"PEN_DOWN"
"MOVE 0 -40"
"MOVE 20 0"
"MOVE 0 40"

SAY "House complete!"

EXIT
