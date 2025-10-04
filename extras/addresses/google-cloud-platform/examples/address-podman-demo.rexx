/* ADDRESS PODMAN Demo - Container Management */

/* Load the ADDRESS PODMAN handler */
REQUIRE '../address-podman.js'

SAY "=== ADDRESS PODMAN Container Management Demo ==="
SAY ""

/* Switch to ADDRESS PODMAN */
ADDRESS PODMAN

/* Check status */
SAY "1. Checking PODMAN status..."
"status"
SAY "   Result: " RESULT
SAY "   Operation: " PODMAN_OPERATION
SAY ""

/* List containers (should be empty initially) */
SAY "2. Listing containers (initially empty)..."
"list"
SAY "   Container count: " PODMAN_COUNT
SAY ""

/* Create a container */
SAY "3. Creating a new container..."
"create image=debian:stable name=demo-container"
SAY "   RC: " RC " - " RESULT
SAY "   Container: " PODMAN_CONTAINER " Status: " PODMAN_STATUS
SAY ""

/* List containers again */
SAY "4. Listing containers after creation..."
"list"
SAY "   Container count: " PODMAN_COUNT
SAY ""

/* Start the container */
SAY "5. Starting the container..."
"start name=demo-container"
SAY "   RC: " RC " - " RESULT
SAY "   Container: " PODMAN_CONTAINER " Status: " PODMAN_STATUS
SAY ""

/* Create another container without specifying name */
SAY "6. Creating auto-named container..."
"create image=ubuntu:latest"
SAY "   RC: " RC " - " RESULT
SAY "   Container: " PODMAN_CONTAINER " Status: " PODMAN_STATUS
SAY ""

/* List all containers */
SAY "7. Listing all containers..."
"list"
SAY "   Total containers: " PODMAN_COUNT
SAY ""

/* Stop the first container */
SAY "8. Stopping demo-container..."
"stop name=demo-container"
SAY "   RC: " RC " - " RESULT
SAY "   Container: " PODMAN_CONTAINER " Status: " PODMAN_STATUS
SAY ""

/* Remove a container */
SAY "9. Removing demo-container..."
"remove name=demo-container"
SAY "   RC: " RC " - " RESULT
SAY "   Container: " PODMAN_CONTAINER
SAY ""

/* Final status */
SAY "10. Final status check..."
"status"
SAY "    Result: " RESULT
SAY ""

/* List remaining containers */
"list"
SAY "    Remaining containers: " PODMAN_COUNT
SAY ""

SAY "=== ADDRESS PODMAN Demo Complete ==="