#!/usr/bin/env rexx
/*
 * Example: Deploy Sinatra Hello World to Docker
 * Demonstrates the unified deployment pattern
 */

SAY '=== Sinatra Hello World Deployment Example ==='
SAY ''

/* Choose environment - change this to test different environments */
environment = 'DOCKER'   /* Options: DOCKER, PODMAN, LXD, NSPAWN, etc. */
instanceName = 'sinatra-demo'
baseImage = 'debian:stable'

SAY 'Environment:' environment
SAY 'Instance:' instanceName
SAY 'Base Image:' baseImage
SAY ''

/* Load Docker handler */
REQUIRE 'rexxjs/address-docker' AS Docker
ADDRESS DOCKER

/* Step 1: Check handler status */
SAY 'Step 1: Checking Docker status...'
"status"
SAY '  ' || RESULT.output
SAY ''

/* Step 2: Create container */
SAY 'Step 2: Creating container...'
"create image=" || baseImage "name=" || instanceName
IF RESULT.success = 0 THEN DO
  SAY '  Error:' RESULT.error
  EXIT 1
END
SAY '  ✅ Container created'
SAY ''

/* Step 3: Start container */
SAY 'Step 3: Starting container...'
"start name=" || instanceName
SAY '  ✅ Container started'
SAY ''

/* Step 4: Detect OS */
SAY 'Step 4: Detecting OS distribution...'
"execute container=" || instanceName "command=cat /etc/os-release"
osRelease = RESULT.stdout
SAY '  OS Release info:'
SAY '  ' || osRelease
SAY ''

/* Step 5: Install Ruby and Sinatra */
SAY 'Step 5: Installing Ruby and dependencies...'
SAY '  Installing ruby...'
"execute container=" || instanceName "command=apt-get update -qq"

SAY '  Installing ruby, ruby-dev, build-essential...'
"execute container=" || instanceName "command=apt-get install -y -qq ruby ruby-dev build-essential"
IF RESULT.exitCode <> 0 THEN DO
  SAY '  Error installing Ruby:' RESULT.stderr
  EXIT 1
END

SAY '  Installing Sinatra gem...'
"execute container=" || instanceName "command=gem install sinatra --no-document"
IF RESULT.exitCode <> 0 THEN DO
  SAY '  Error installing Sinatra:' RESULT.stderr
  EXIT 1
END
SAY '  ✅ Dependencies installed'
SAY ''

/* Step 6: Create application directory */
SAY 'Step 6: Creating application directory...'
"execute container=" || instanceName "command=mkdir -p /app"
SAY '  ✅ Directory created'
SAY ''

/* Step 7: Deploy Sinatra application */
SAY 'Step 7: Deploying Sinatra application...'

/* Create the Sinatra app code */
sinatraApp = "require 'sinatra'" || '0a'x || ,
             "require 'socket'" || '0a'x || ,
             "" || '0a'x || ,
             "set :bind, '0.0.0.0'" || '0a'x || ,
             "set :port, 4567" || '0a'x || ,
             "" || '0a'x || ,
             "get '/' do" || '0a'x || ,
             '  "Hello from Sinatra! Running on #{Socket.gethostname}"' || '0a'x || ,
             "end" || '0a'x || ,
             "" || '0a'x || ,
             "get '/health' do" || '0a'x || ,
             "  content_type :json" || '0a'x || ,
             '  { status: "ok", hostname: Socket.gethostname() }.to_json' || '0a'x || ,
             "end" || '0a'x

/* Write to temp file */
tempFile = '/tmp/sinatra_app_' || TIME('S') || '.rb'
CALL CHAROUT tempFile, sinatraApp
CALL STREAM tempFile, 'C', 'CLOSE'

SAY '  Created app.rb (' || LENGTH(sinatraApp) 'bytes)'

/* Copy to container */
SAY '  Copying to container...'
"copy_to container=" || instanceName "local=" || tempFile "remote=/app/app.rb"
IF RESULT.success = 0 THEN DO
  SAY '  Error copying file:' RESULT.error
  EXIT 1
END

/* Cleanup temp file */
ADDRESS BASH
"rm -f" tempFile

SAY '  ✅ Application deployed'
SAY ''

/* Step 8: Verify deployment */
SAY 'Step 8: Verifying deployment...'
ADDRESS DOCKER
"execute container=" || instanceName "command=ls -lh /app/"
SAY '  Files in /app:'
SAY '  ' || RESULT.stdout
SAY ''

/* Step 9: Instructions for running */
SAY '=== Deployment Complete! ==='
SAY ''
SAY 'To run the application:'
SAY '  docker exec -d' instanceName 'sh -c "cd /app && ruby app.rb"'
SAY ''
SAY 'To test it (from host):'
SAY '  docker exec' instanceName 'curl http://localhost:4567'
SAY ''
SAY 'To view logs:'
SAY '  docker logs' instanceName
SAY ''
SAY 'To stop and remove:'
SAY '  docker stop' instanceName
SAY '  docker rm' instanceName
SAY ''

/* Optional: Auto-start the app */
PARSE PULL response 'Do you want to start the app now? (y/n): ' .
IF ABBREV('YES', response~upper, 1) THEN DO
  SAY ''
  SAY 'Starting Sinatra app in background...'
  "execute container=" || instanceName "command=nohup ruby /app/app.rb > /app/sinatra.log 2>&1 &"
  SAY '  ✅ Application started'
  SAY ''
  SAY 'Testing...'
  ADDRESS BASH
  "sleep 2"
  ADDRESS DOCKER
  "execute container=" || instanceName "command=curl -s http://localhost:4567"
  SAY '  Response:' RESULT.stdout
  SAY ''
END

EXIT 0
