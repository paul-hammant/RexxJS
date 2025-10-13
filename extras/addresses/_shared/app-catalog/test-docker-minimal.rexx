#!/usr/bin/env rexx
/* Minimal test to debug container creation */

REQUIRE '/home/paul/scm/RexxJS/extras/addresses/docker-address/docker-address.js'
ADDRESS DOCKER

SAY 'Creating container with sleep command...'
"create image=alpine:latest name=test-minimal command=sleep 3600"
SAY 'Created:' RESULT.success
SAY 'Container:' RESULT.container
SAY 'ID:' RESULT.containerId

SAY ''
SAY 'Starting container...'
"start name=test-minimal"
SAY 'Started:' RESULT.success

SAY ''
SAY 'Checking if running (via actual docker command)...'
ADDRESS SYSTEM
"docker ps --filter name=test-minimal --format '{{.Names}} {{.Status}}'"

SAY ''
SAY 'Cleaning up...'
ADDRESS DOCKER
"stop name=test-minimal"
"remove name=test-minimal"

EXIT 0
