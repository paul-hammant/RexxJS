/* Toy Story moment: "Hey, Etch. Draw!" */
/* Etch draws a stick figure at rapid pace */

SAY "Hey, Etch. Draw!"
SAY ""

-- Register the Rexx-A-Sketch control endpoint
ADDRESS "http://localhost:8084/api/etch" AUTH "dev-token-12345" AS ETCH

-- Clear the canvas first
"CLEAR"
SAY "Canvas cleared"

-- Draw stick figure using the built-in command
SAY "Drawing stick figure..."
"DRAW_STICK_FIGURE"

SAY ""
SAY "Ding! Got me again, Etch."
SAY "You've been working on that draw."
SAY "Fastest knobs in the west!"

EXIT
