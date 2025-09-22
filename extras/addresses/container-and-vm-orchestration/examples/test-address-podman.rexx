/* Test ADDRESS PODMAN functionality */

/* Load the ADDRESS PODMAN handler */
REQUIRE './extras/addresses/container-and-vm-orchestration/address-podman.js'

SAY "ADDRESS PODMAN handler loaded successfully"

/* Switch to ADDRESS PODMAN and test status */
ADDRESS PODMAN
SAY "Switched to ADDRESS PODMAN"

"status"
SAY "Status command executed"

/* Display results */
SAY "RC=" RC
SAY "RESULT=" RESULT

/* Test container creation */
"create image=debian:stable name=test-container"
SAY "Container creation - RC=" RC

/* Test listing containers */
"list"
SAY "List containers - RC=" RC " Count=" PODMAN_COUNT