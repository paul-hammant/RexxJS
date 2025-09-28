-- Deploy Hello World Web Container to Remote Docker Host
-- Deploys a simple web container accessible from external hosts
-- Usage: deploy-hello-world-container.rexx HOST USER [PORT]

REQUIRE "./extras/addresses/remote/address-ssh.js"

PARSE ARG HOST, USER, PORT

IF HOST = '' | USER = '' THEN DO
  SAY 'Usage: deploy-hello-world-container.rexx HOST USER [PORT]'
  SAY 'Example: deploy-hello-world-container.rexx 192.168.0.253 paul 8080'
  EXIT 1
END

IF PORT = '' THEN PORT = '8080'

SAY 'Deploying Hello World container to' USER '@' HOST ':' PORT
SAY '=================================================='

-- Connect to remote host
ADDRESS ssh
connect host=HOST user=USER id=deploy

-- Check if Docker is available
SAY 'Step 1: Checking Docker availability...'
ADDRESS ssh
result = exec id=deploy command='sudo docker --version' timeout=10000
SAY 'Docker check completed'

-- Stop and remove any existing hello-world container
SAY 'Step 2: Cleaning up any existing containers...'
ADDRESS ssh
exec id=deploy command='sudo docker stop hello-world-rexx 2>/dev/null || true' timeout=10000
ADDRESS ssh  
exec id=deploy command='sudo docker rm hello-world-rexx 2>/dev/null || true' timeout=10000

-- Pull nginx image (lightweight web server)
SAY 'Step 3: Pulling nginx image...'
ADDRESS ssh
exec id=deploy command='sudo docker pull nginx:alpine' timeout=120000

-- Create custom index.html content
SAY 'Step 4: Creating custom web content...'
ADDRESS ssh
exec id=deploy command='mkdir -p /tmp/hello-rexx' timeout=5000

-- Create HTML content using heredoc
html_content = '<!DOCTYPE html>' || '0A'x ||,
'<html>' || '0A'x ||,
'<head>' || '0A'x ||,
'    <title>Hello from RexxJS!</title>' || '0A'x ||,
'    <style>' || '0A'x ||,
'        body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }' || '0A'x ||,
'        .container { background: rgba(255,255,255,0.1); padding: 50px; border-radius: 20px; display: inline-block; }' || '0A'x ||,
'        h1 { font-size: 3em; margin-bottom: 20px; }' || '0A'x ||,
'        p { font-size: 1.2em; line-height: 1.6; }' || '0A'x ||,
'        .info { background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; margin-top: 30px; }' || '0A'x ||,
'    </style>' || '0A'x ||,
'</head>' || '0A'x ||,
'<body>' || '0A'x ||,
'    <div class="container">' || '0A'x ||,
'        <h1>🎉 Hello from RexxJS! 🎉</h1>' || '0A'x ||,
'        <p>This container was deployed using a REXX script via SSH!</p>' || '0A'x ||,
'        <div class="info">' || '0A'x ||,
'            <p><strong>Host:</strong>' HOST '</p>' || '0A'x ||,
'            <p><strong>Port:</strong>' PORT '</p>' || '0A'x ||,
'            <p><strong>Deployed by:</strong> RexxJS Container Orchestration</p>' || '0A'x ||,
'            <p><strong>Container:</strong> nginx:alpine</p>' || '0A'x ||,
'        </div>' || '0A'x ||,
'    </div>' || '0A'x ||,
'</body>' || '0A'x ||,
'</html>'

-- Write HTML content to remote file
ADDRESS ssh
exec id=deploy command='cat > /tmp/hello-rexx/index.html << '"'"'EOF'"'"'' || '0A'x || html_content || '0A'x || 'EOF' timeout=10000

-- Deploy and run the container
SAY 'Step 5: Deploying container on port' PORT '...'
ADDRESS ssh
exec id=deploy command='sudo docker run -d --name hello-world-rexx -p' PORT':80 -v /tmp/hello-rexx:/usr/share/nginx/html:ro nginx:alpine' timeout=30000

-- Verify container is running
SAY 'Step 6: Verifying deployment...'
ADDRESS ssh
exec id=deploy command='sudo docker ps --filter name=hello-world-rexx --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"' timeout=10000

-- Test container response
SAY 'Step 7: Testing container response...'
ADDRESS ssh
exec id=deploy command='curl -f http://localhost:' || PORT || ' >/dev/null 2>&1' timeout=10000
IF RC = 0 THEN DO
  SAY 'SUCCESS: Container is responding on port' PORT
ELSE DO
  SAY 'WARNING: Container may not be fully ready yet'
END

-- Show access information
SAY ''
SAY 'Container Deployment Complete!'
SAY '============================='
SAY 'Access URL: http://' || HOST || ':' || PORT
SAY 'Container name: hello-world-rexx'
SAY ''
SAY 'To stop the container:'
SAY '  docker stop hello-world-rexx'
SAY ''
SAY 'To view logs:'
SAY '  docker logs hello-world-rexx'
SAY ''
SAY 'To remove the container:'
SAY '  docker rm hello-world-rexx'

-- Close SSH connection
ADDRESS ssh
close id=deploy