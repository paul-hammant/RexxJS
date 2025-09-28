-- Simple test script for remote RexxJS execution
SAY 'RexxJS remote execution test'
SAY 'Host:' ENV.HOSTNAME 
SAY 'User:' ENV.USER
SAY 'Current directory:' 

ADDRESS system
'pwd'
SAY 'RC from pwd:' RC

SAY 'System information:'
ADDRESS system
'uname -a'

SAY 'Test completed successfully!'