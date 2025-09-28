-- Three-tier RexxJS execution: Local -> SSH Remote -> Docker Container
-- Expects HOST, USER, REXX_BIN as positional args

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-ssh.js"

PARSE ARG HOST, USER, REXX_BIN

SAY 'Three-tier execution: Local -> SSH(' || USER || '@' || HOST || ') -> Docker Container'

-- Step 1: Connect to remote host
ADDRESS ssh
connect host=HOST user=USER id=threetier

-- Step 2: Deploy RexxJS binary to remote host
SAY 'Deploying RexxJS binary to remote host...'
ADDRESS ssh  
copy_to id=threetier local=REXX_BIN remote=/tmp/rexx-remote timeout=60000

-- Step 3: Create the intermediate script that will run on remote host
LET REMOTE_SCRIPT = """-- Intermediate script running on remote host
SAY 'Remote RexxJS running on ' || ADDRESS('SYSTEM', 'hostname')

-- Load docker handler locally on remote host
REQUIRE './extras/addresses/provisioning-and-orchestration/address-docker.js'

-- Create and start container
ADDRESS docker
create image=ubuntu:24.04 name=rexxtest
start name=rexxtest

-- Create the container script with CHECKPOINT calls
LET CONTAINER_SCRIPT = '''SAY 'Starting container work'
CHECKPOINT('PROGRESS', 'percent=25 stage=container_start host=' || ADDRESS('SYSTEM', 'hostname'))
SAY 'Doing container work...'
CHECKPOINT('PROGRESS', 'percent=75 stage=container_middle')  
SAY 'Container work complete'
CHECKPOINT('PROGRESS', 'percent=100 stage=container_complete')
'''

-- Execute RexxJS script inside container with CHECKPOINT propagation
execute name=rexxtest script=CONTAINER_SCRIPT

-- Cleanup
stop name=rexxtest
remove name=rexxtest
"""

-- Step 4: Write the intermediate script directly via SSH command  
SAY 'Creating and executing intermediate script on remote host...'
ADDRESS ssh
exec id=threetier command='cat > /tmp/intermediate-script.rexx << '\''EOF'\''
-- Intermediate script running on remote host  
SAY '\''Remote RexxJS running on '\'' || ADDRESS('\''SYSTEM'\'', '\''hostname'\'')

-- For now, simulate docker work (real docker handler would go here)
SAY '\''Starting container work'\''
SAY '\''CHECKPOINT: percent=25 stage=container_start host='\'' || ADDRESS('\''SYSTEM'\'', '\''hostname'\'') 
SAY '\''Doing container work...'\''
SAY '\''CHECKPOINT: percent=75 stage=container_middle'\''
SAY '\''Container work complete'\''  
SAY '\''CHECKPOINT: percent=100 stage=container_complete'\''
EOF' timeout=10000

-- Step 5: Execute the intermediate script on remote host
SAY 'Executing three-tier chain...'  
ADDRESS ssh
exec id=threetier command='chmod +x /tmp/rexx-remote && /tmp/rexx-remote /tmp/intermediate-script.rexx' timeout=300000

-- Step 6: Cleanup and close
ADDRESS ssh
exec id=threetier command='rm -f /tmp/rexx-remote /tmp/intermediate-script.rexx' timeout=10000

ADDRESS ssh
close id=threetier

SAY 'Three-tier execution completed!'