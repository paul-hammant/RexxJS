#!/usr/bin/env rexx
/*
 * Unified Application Deployer
 * Deploys reference applications to any environment
 *
 * Usage:
 *   ./deploy-app.rexx <environment> <app-id> [instance-name] [image]
 *
 * Environments:
 *   docker, podman, lxd, qemu, nspawn, firecracker, virtualbox, proxmox
 *
 * Applications:
 *   sinatra-hello, express-hello, flask-hello
 *
 * Examples:
 *   ./deploy-app.rexx docker sinatra-hello my-app debian:stable
 *   ./deploy-app.rexx lxd flask-hello webapp ubuntu:22.04
 *   ./deploy-app.rexx podman express-hello node-app alpine:latest
 */

PARSE ARG environment appId instanceName image .

/* Validate arguments */
IF environment = '' THEN DO
  SAY 'Error: Environment required'
  SAY ''
  SAY 'Usage: deploy-app.rexx <environment> <app-id> [instance-name] [image]'
  SAY ''
  SAY 'Environments: docker, podman, lxd, qemu, nspawn, firecracker, virtualbox, proxmox'
  SAY 'Applications: sinatra-hello, express-hello, flask-hello'
  EXIT 1
END

IF appId = '' THEN DO
  SAY 'Error: Application ID required'
  SAY ''
  SAY 'Available applications:'
  SAY '  sinatra-hello  - Ruby Sinatra web app (port 4567)'
  SAY '  express-hello  - Node.js Express web app (port 3000)'
  SAY '  flask-hello    - Python Flask web app (port 5000)'
  EXIT 1
END

/* Default values */
IF instanceName = '' THEN instanceName = appId || '-instance'
IF image = '' THEN image = 'debian:stable'  /* Default base image */

SAY '=== Unified Application Deployment ==='
SAY ''
SAY 'Environment:' environment
SAY 'Application:' appId
SAY 'Instance:' instanceName
SAY 'Base Image:' image
SAY ''

/* Load application registry */
REQUIRE 'cwd:app-registry.js' AS AppRegistry

/* Get application definition */
app = AppRegistry.getApp(appId)
SAY 'Deploying:' app.name
SAY 'Language:' app.language
SAY 'Runtime:' app.runtime
SAY 'Port:' app.port
SAY ''

/* Deploy based on environment type */
SELECT
  WHEN environment = 'DOCKER' THEN CALL DeployDocker
  WHEN environment = 'PODMAN' THEN CALL DeployPodman
  WHEN environment = 'LXD' THEN CALL DeployLXD
  WHEN environment = 'QEMU' THEN CALL DeployQEMU
  WHEN environment = 'NSPAWN' THEN CALL DeployNspawn
  WHEN environment = 'FIRECRACKER' THEN CALL DeployFirecracker
  WHEN environment = 'VIRTUALBOX' THEN CALL DeployVirtualBox
  WHEN environment = 'PROXMOX' THEN CALL DeployProxmox
  OTHERWISE DO
    SAY 'Error: Unknown environment:' environment
    EXIT 1
  END
END

SAY ''
SAY '=== Deployment Complete ==='
SAY ''
SAY 'Application URL: http://localhost:' || app.port
SAY 'Health check:' app.healthCheck
EXIT 0

/*
 * Docker Deployment
 */
DeployDocker: PROCEDURE EXPOSE instanceName image app appId
  SAY 'Step 1: Loading Docker handler...'
  REQUIRE 'rexxjs/address-docker' AS Docker
  ADDRESS DOCKER

  SAY 'Step 2: Creating container...'
  "create image=" || image "name=" || instanceName
  IF RESULT.success = 0 THEN DO
    SAY 'Error creating container:' RESULT.error
    EXIT 1
  END

  SAY 'Step 3: Starting container...'
  "start name=" || instanceName
  IF RESULT.success = 0 THEN EXIT 1

  SAY 'Step 4: Detecting OS distribution...'
  "execute container=" || instanceName "command=cat /etc/os-release"
  osRelease = RESULT.stdout
  distro = AppRegistry.detectDistro(osRelease)
  SAY 'Detected:' distro

  SAY 'Step 5: Installing dependencies...'
  installCmds = app.install[distro]
  DO i = 1 TO installCmds~length
    cmd = installCmds[i]
    SAY '  Running:' cmd
    "execute container=" || instanceName "command=" || cmd
    IF RESULT.exitCode <> 0 THEN DO
      SAY '  Error:' RESULT.stderr
      EXIT 1
    END
  END

  SAY 'Step 6: Deploying application files...'
  CALL DeployAppFiles instanceName app 'DOCKER'

  SAY 'Step 7: Running setup commands...'
  IF app.setup <> .nil THEN DO
    DO i = 1 TO app.setup~length
      cmd = app.setup[i]
      SAY '  Running:' cmd
      "execute container=" || instanceName "command=cd /app && " || cmd
    END
  END

  SAY 'Step 8: Starting application...'
  SAY '  Start command:' app.start
  /* Note: Application runs in foreground, would need process management */
  SAY '  (Application ready to start with: docker exec' instanceName 'sh -c "cd /app &&' app.start '")'

  RETURN

/*
 * Podman Deployment
 */
DeployPodman: PROCEDURE EXPOSE instanceName image app appId
  SAY 'Step 1: Loading Podman handler...'
  REQUIRE 'rexxjs/address-podman' AS Podman
  ADDRESS PODMAN

  SAY 'Step 2: Creating container...'
  "create image=" || image "name=" || instanceName
  IF RESULT.success = 0 THEN EXIT 1

  SAY 'Step 3: Starting container...'
  "start name=" || instanceName

  SAY 'Step 4: Detecting OS...'
  "execute container=" || instanceName "command=cat /etc/os-release"
  distro = AppRegistry.detectDistro(RESULT.stdout)
  SAY 'Detected:' distro

  SAY 'Step 5: Installing dependencies...'
  installCmds = app.install[distro]
  DO i = 1 TO installCmds~length
    "execute container=" || instanceName "command=" || installCmds[i]
  END

  SAY 'Step 6: Deploying application...'
  CALL DeployAppFiles instanceName app 'PODMAN'

  SAY 'Step 7: Application ready'
  RETURN

/*
 * LXD Deployment
 */
DeployLXD: PROCEDURE EXPOSE instanceName image app
  SAY 'Step 1: Loading LXD handler...'
  REQUIRE 'cwd:../../lxd-address/lxd-address.js' AS LXD
  ADDRESS LXD

  SAY 'Step 2: Creating container...'
  "create image=" || image "name=" || instanceName
  IF RESULT.success = 0 THEN EXIT 1

  SAY 'Step 3: Starting container...'
  "start name=" || instanceName

  SAY 'Step 4: Installing dependencies...'
  "execute name=" || instanceName "command=cat /etc/os-release"
  distro = AppRegistry.detectDistro(RESULT.stdout)
  installCmds = app.install[distro]
  DO i = 1 TO installCmds~length
    "execute name=" || instanceName "command=" || installCmds[i]
  END

  SAY 'Step 5: Deploying application...'
  CALL DeployAppFiles instanceName app 'LXD'

  RETURN

/*
 * QEMU Deployment
 */
DeployQEMU: PROCEDURE EXPOSE instanceName image app
  SAY 'QEMU deployment - Use VM with SSH access'
  SAY 'Implementation depends on QEMU ADDRESS handler execute commands'
  RETURN

/*
 * nspawn Deployment
 */
DeployNspawn: PROCEDURE EXPOSE instanceName image app
  SAY 'nspawn deployment - Container-based'
  REQUIRE 'cwd:../../nspawn-address/nspawn-address.js' AS Nspawn
  ADDRESS NSPAWN

  "create name=" || instanceName
  "start name=" || instanceName

  "execute name=" || instanceName "command=cat /etc/os-release"
  distro = AppRegistry.detectDistro(RESULT.stdout)
  installCmds = app.install[distro]
  DO i = 1 TO installCmds~length
    "execute name=" || instanceName "command=" || installCmds[i]
  END

  CALL DeployAppFiles instanceName app 'NSPAWN'
  RETURN

/*
 * Firecracker Deployment
 */
DeployFirecracker: PROCEDURE EXPOSE instanceName image app
  SAY 'Firecracker deployment - MicroVM'
  SAY 'Requires rootfs image and kernel'
  RETURN

/*
 * VirtualBox Deployment
 */
DeployVirtualBox: PROCEDURE EXPOSE instanceName image app
  SAY 'VirtualBox deployment - Full VM'
  SAY 'Implementation depends on VirtualBox ADDRESS handler'
  RETURN

/*
 * Proxmox Deployment
 */
DeployProxmox: PROCEDURE EXPOSE instanceName image app
  SAY 'Proxmox deployment - LXC container'
  SAY 'Implementation depends on Proxmox ADDRESS handler'
  RETURN

/*
 * Helper: Deploy application files to container/VM
 */
DeployAppFiles: PROCEDURE EXPOSE app
  PARSE ARG target, appDef, envType

  SAY '  Creating /app directory...'

  /* Create app directory based on environment */
  SELECT
    WHEN envType = 'DOCKER' THEN DO
      ADDRESS DOCKER
      "execute container=" || target "command=mkdir -p /app"
    END
    WHEN envType = 'PODMAN' THEN DO
      ADDRESS PODMAN
      "execute container=" || target "command=mkdir -p /app"
    END
    WHEN envType = 'LXD' THEN DO
      ADDRESS LXD
      "execute name=" || target "command=mkdir -p /app"
    END
    WHEN envType = 'NSPAWN' THEN DO
      ADDRESS NSPAWN
      "execute name=" || target "command=mkdir -p /app"
    END
    OTHERWISE NOP
  END

  /* Write each application file */
  SAY '  Writing application files...'
  DO filename OVER appDef.app~allIndexes
    content = appDef.app[filename]
    SAY '    -' filename '(' || LENGTH(content) 'bytes)'

    /* Write file via temp file and copy */
    tempFile = '/tmp/app_' || filename~translate('_', '/')
    CALL CHAROUT tempFile, content
    CALL STREAM tempFile, 'C', 'CLOSE'

    /* Copy to target based on environment */
    SELECT
      WHEN envType = 'DOCKER' THEN DO
        ADDRESS DOCKER
        "copy_to container=" || target "local=" || tempFile "remote=/app/" || filename
      END
      WHEN envType = 'PODMAN' THEN DO
        ADDRESS PODMAN
        "copy_to container=" || target "local=" || tempFile "remote=/app/" || filename
      END
      WHEN envType = 'LXD' THEN DO
        /* LXD file push */
        ADDRESS BASH
        "lxc file push" tempFile target || "/app/" || filename
      END
      WHEN envType = 'NSPAWN' THEN DO
        /* nspawn copy */
        ADDRESS BASH
        "machinectl copy-to" target tempFile "/app/" || filename
      END
      OTHERWISE NOP
    END

    /* Cleanup temp file */
    ADDRESS BASH
    "rm -f" tempFile
  END

  RETURN
