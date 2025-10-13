#!/usr/bin/env rexx
/*
 * Simple Working Sinatra Deployment to Docker
 * Uses only REAL, TESTED Docker ADDRESS commands
 */

SAY '=== Simple Sinatra Docker Deployment ==='
SAY ''

/* Configuration */
containerName = 'sinatra-demo'
baseImage = 'debian:stable'

SAY 'Container:' containerName
SAY 'Base Image:' baseImage
SAY ''

/* Load Docker handler with absolute path */
REQUIRE '../../docker-address/docker-address.js'
ADDRESS DOCKER

/* Step 1: Check Docker status */
SAY 'Step 1: Checking Docker status...'
"status"
SAY '  Runtime:' RESULT.runtime
SAY '  Active containers:' RESULT.activeContainers
SAY ''

/* Step 2: Create container */
SAY 'Step 2: Creating container...'
"create image=" || baseImage "name=" || containerName
IF RESULT.success = 0 THEN DO
  SAY '  Error:' RESULT.error
  EXIT 1
END
SAY '  ✅ Container created'
SAY ''

/* Step 3: Start container */
SAY 'Step 3: Starting container...'
"start name=" || containerName
IF RESULT.success = 0 THEN DO
  SAY '  Error:' RESULT.error
  EXIT 1
END
SAY '  ✅ Container started'
SAY ''

/* Step 4: Install Ruby and Sinatra */
SAY 'Step 4: Installing Ruby and Sinatra...'
SAY '  Updating package list...'
"execute container=" || containerName "command=apt-get update -qq"

SAY '  Installing Ruby...'
"execute container=" || containerName "command=apt-get install -y -qq ruby ruby-dev build-essential"
IF RESULT.exitCode <> 0 THEN DO
  SAY '  Error installing Ruby:' RESULT.stderr
  EXIT 1
END

SAY '  Installing Sinatra gem...'
"execute container=" || containerName "command=gem install sinatra --no-document"
IF RESULT.exitCode <> 0 THEN DO
  SAY '  Error installing Sinatra:' RESULT.stderr
  EXIT 1
END
SAY '  ✅ Ruby and Sinatra installed'
SAY ''

/* Step 5: Create Sinatra app */
SAY 'Step 5: Creating Sinatra application...'
"execute container=" || containerName "command=mkdir -p /app"

/* Create app.rb content */
appCode = "require 'sinatra'" || '0a'x || ,
          "require 'socket'" || '0a'x || ,
          "" || '0a'x || ,
          "set :bind, '0.0.0.0'" || '0a'x || ,
          "set :port, 4567" || '0a'x || ,
          "" || '0a'x || ,
          "get '/' do" || '0a'x || ,
          '  "Hello from Sinatra! Container: #{Socket.gethostname}"' || '0a'x || ,
          "end"

/* Write to temp file */
tempFile = '/tmp/sinatra_app.rb'
CALL CHAROUT tempFile, appCode
CALL STREAM tempFile, 'C', 'CLOSE'

SAY '  Copying app to container...'
"copy_to container=" || containerName "local=" || tempFile "remote=/app/app.rb"
IF RESULT.success = 0 THEN DO
  SAY '  Error copying file:' RESULT.error
  EXIT 1
END

/* Cleanup temp file */
ADDRESS BASH
"rm -f" tempFile
ADDRESS DOCKER

SAY '  ✅ Application deployed'
SAY ''

/* Step 6: Start Sinatra */
SAY 'Step 6: Starting Sinatra server...'
"execute container=" || containerName "command=nohup ruby /app/app.rb > /app/sinatra.log 2>&1 &"
SAY '  ✅ Server started'
SAY ''

/* Step 7: Wait and test */
SAY 'Step 7: Testing application...'
SAY '  Waiting 3 seconds for server to start...'
ADDRESS BASH
"sleep 3"
ADDRESS DOCKER

SAY '  Testing endpoint...'
"execute container=" || containerName "command=curl -s http://localhost:4567"
IF RESULT.exitCode = 0 THEN DO
  SAY '  Response:' RESULT.stdout
  SAY '  ✅ Application working!'
END
ELSE DO
  SAY '  ⚠️  Could not reach application'
  SAY '  Checking logs...'
  "execute container=" || containerName "command=cat /app/sinatra.log"
  SAY '  Logs:' RESULT.stdout
END
SAY ''

SAY '=== Deployment Complete! ==='
SAY ''
SAY 'To stop and remove:'
SAY '  docker stop' containerName
SAY '  docker rm' containerName
SAY ''

EXIT 0
