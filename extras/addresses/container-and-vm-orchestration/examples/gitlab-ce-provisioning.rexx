-- GitLab CE Container Provisioning with Real-Time Progress Tracking
-- Demonstrates the full power of ADDRESS PODMAN with bidirectional CHECKPOINT monitoring
-- This script provisions a complete GitLab CE installation with ~12 detailed progress steps

SAY "=== GitLab CE Container Provisioning Demo ==="
SAY ""
SAY "This script will provision a complete GitLab CE installation with:"
SAY "• Ubuntu 22.04 container with enhanced security"
SAY "• PostgreSQL database with optimized configuration" 
SAY "• Redis cache for performance"
SAY "• GitLab CE with SSL and proper initialization"
SAY "• Real-time progress tracking via CHECKPOINT"
SAY ""

-- Initialize ADDRESS PODMAN with production-ready security
ADDRESS podman
initialize securityMode=moderate trustedBinaries="../../rexx-linux-x64" maxContainers=3

-- Start process and checkpoint monitoring
start_monitoring
SAY "Process monitoring enabled"

SAY ""
SAY "=== CHECKPOINT 1: Container Provisioning ==="
CHECKPOINT('PROVISION_START', '{"stage": "container", "progress": 8, "description": "Creating Ubuntu 22.04 container"}')

-- Create container with resource limits appropriate for GitLab
create image=ubuntu:22.04 name=gitlab-ce-container memory=4g cpus=2.0 interactive=true environment="DEBIAN_FRONTEND=noninteractive,TZ=UTC"
SAY "Container created with 4GB RAM and 2 CPU cores"

start name=gitlab-ce-container
SAY "Container started successfully"

-- Deploy RexxJS to the container for progress monitoring
deploy_rexx container=gitlab-ce-container rexx_binary="../../rexx-linux-x64" target="/usr/local/bin/rexx"
IF RC \= 0 THEN DO
  SAY "Failed to deploy RexxJS to container. Exiting."
  cleanup all=true
  EXIT 1
END

SAY ""
SAY "=== CHECKPOINT 2: System Updates ==="
CHECKPOINT('SYSTEM_UPDATE', '{"stage": "updates", "progress": 16, "description": "Updating package repositories"}')

-- Update package repositories
updateScript = 'CHECKPOINT("UPDATE_START", "phase=apt-update"); ' ||,
               'ADDRESS system; ' ||,
               '"apt-get update -y"; ' ||,
               'updateRC = RC; ' ||,
               'CHECKPOINT("UPDATE_COMPLETE", "phase=apt-update exitcode=" updateRC); ' ||,
               'IF updateRC \= 0 THEN EXIT updateRC'

execute_rexx container=gitlab-ce-container script=updateScript progress_callback=true timeout=300000
SAY "System packages updated (RC: " RC ")"

SAY ""
SAY "=== CHECKPOINT 3: Essential Dependencies ==="
CHECKPOINT('DEPENDENCIES', '{"stage": "base-packages", "progress": 24, "description": "Installing essential packages"}')

dependenciesScript = 'CHECKPOINT("DEPS_START", "phase=dependencies"); ' ||,
                    'ADDRESS system; ' ||,
                    '"apt-get install -y curl wget gnupg2 software-properties-common ca-certificates"; ' ||,
                    'depsRC = RC; ' ||,
                    'CHECKPOINT("DEPS_COMPLETE", "phase=dependencies exitcode=" depsRC); ' ||,
                    'IF depsRC \= 0 THEN EXIT depsRC'

execute_rexx container=gitlab-ce-container script=dependenciesScript progress_callback=true timeout=300000
SAY "Essential dependencies installed (RC: " RC ")"

SAY ""
SAY "=== CHECKPOINT 4: GitLab Repository Setup ==="
CHECKPOINT('GITLAB_REPO', '{"stage": "repository", "progress": 32, "description": "Adding GitLab CE repository and GPG keys"}')

gitlabRepoScript = 'CHECKPOINT("REPO_START", "phase=gitlab-repo"); ' ||,
                  'ADDRESS system; ' ||,
                  '"curl -fsSL https://packages.gitlab.com/gitlab/gitlab-ce/gpgkey | gpg --dearmor -o /usr/share/keyrings/gitlab.gpg"; ' ||,
                  'gpgRC = RC; ' ||,
                  'CHECKPOINT("GPG_ADDED", "phase=gpg-key exitcode=" gpgRC); ' ||,
                  'IF gpgRC = 0 THEN DO; ' ||,
                  '  "echo \"deb [signed-by=/usr/share/keyrings/gitlab.gpg] https://packages.gitlab.com/gitlab/gitlab-ce/ubuntu/ jammy main\" > /etc/apt/sources.list.d/gitlab_gitlab-ce.list"; ' ||,
                  '  "apt-get update -y"; ' ||,
                  '  repoRC = RC; ' ||,
                  '  CHECKPOINT("REPO_COMPLETE", "phase=gitlab-repo exitcode=" repoRC); ' ||,
                  'END; ' ||,
                  'ELSE DO; ' ||,
                  '  CHECKPOINT("REPO_FAILED", "phase=gitlab-repo error=gpg-key-failed"); ' ||,
                  '  EXIT gpgRC; ' ||,
                  'END'

execute_rexx container=gitlab-ce-container script=gitlabRepoScript progress_callback=true timeout=300000
SAY "GitLab repository configured (RC: " RC ")"

SAY ""
SAY "=== CHECKPOINT 5: PostgreSQL Installation ==="
CHECKPOINT('POSTGRESQL', '{"stage": "database", "progress": 40, "description": "Installing and configuring PostgreSQL"}')

postgresScript = 'CHECKPOINT("POSTGRES_START", "phase=postgresql-install"); ' ||,
                'ADDRESS system; ' ||,
                '"apt-get install -y postgresql postgresql-contrib"; ' ||,
                'pgInstallRC = RC; ' ||,
                'CHECKPOINT("POSTGRES_INSTALLED", "phase=postgresql-install exitcode=" pgInstallRC); ' ||,
                'IF pgInstallRC = 0 THEN DO; ' ||,
                '  "service postgresql start"; ' ||,
                '  "sudo -u postgres createuser --createdb --no-createrole --no-superuser gitlab"; ' ||,
                '  "sudo -u postgres createdb --owner=gitlab gitlabhq_production"; ' ||,
                '  dbRC = RC; ' ||,
                '  CHECKPOINT("POSTGRES_COMPLETE", "phase=postgresql-setup exitcode=" dbRC " database=gitlabhq_production"); ' ||,
                'END; ' ||,
                'ELSE EXIT pgInstallRC'

execute_rexx container=gitlab-ce-container script=postgresScript progress_callback=true timeout=300000
SAY "PostgreSQL installed and configured (RC: " RC ")"

SAY ""
SAY "=== CHECKPOINT 6: Redis Cache Setup ==="
CHECKPOINT('REDIS', '{"stage": "cache", "progress": 48, "description": "Installing Redis cache server"}')

redisScript = 'CHECKPOINT("REDIS_START", "phase=redis-install"); ' ||,
             'ADDRESS system; ' ||,
             '"apt-get install -y redis-server"; ' ||,
             'redisInstallRC = RC; ' ||,
             'CHECKPOINT("REDIS_INSTALLED", "phase=redis-install exitcode=" redisInstallRC); ' ||,
             'IF redisInstallRC = 0 THEN DO; ' ||,
             '  "service redis-server start"; ' ||,
             '  serviceRC = RC; ' ||,
             '  CHECKPOINT("REDIS_COMPLETE", "phase=redis-service exitcode=" serviceRC); ' ||,
             'END; ' ||,
             'ELSE EXIT redisInstallRC'

execute_rexx container=gitlab-ce-container script=redisScript progress_callback=true timeout=180000
SAY "Redis cache server configured (RC: " RC ")"

SAY ""
SAY "=== CHECKPOINT 7: GitLab CE Package Installation (Large Download) ==="
CHECKPOINT('GITLAB_INSTALL', '{"stage": "gitlab-download", "progress": 56, "description": "Downloading GitLab CE package (may take several minutes)"}')

-- This is the big one - GitLab CE package is several hundred MB
gitlabInstallScript = 'CHECKPOINT("GITLAB_DOWNLOAD_START", "phase=gitlab-ce-install size=large"); ' ||,
                     'ADDRESS system; ' ||,
                     '"apt-get install -y gitlab-ce"; ' ||,
                     'gitlabRC = RC; ' ||,
                     'CHECKPOINT("GITLAB_INSTALL_COMPLETE", "phase=gitlab-ce-install exitcode=" gitlabRC " size=large"); ' ||,
                     'IF gitlabRC \= 0 THEN EXIT gitlabRC'

execute_rexx container=gitlab-ce-container script=gitlabInstallScript progress_callback=true timeout=1800000
SAY "GitLab CE package installed (RC: " RC ")"

SAY ""
SAY "=== CHECKPOINT 8: GitLab Configuration ==="
CHECKPOINT('GITLAB_CONFIG', '{"stage": "configuration", "progress": 64, "description": "Configuring GitLab settings"}')

configScript = 'CHECKPOINT("CONFIG_START", "phase=gitlab-config"); ' ||,
              'config_content = "external_url \"http://localhost\"" || \'0A\'X || "postgresql[\"enable\"] = false" || \'0A\'X || "gitlab_rails[\"db_adapter\"] = \"postgresql\"" || \'0A\'X || "gitlab_rails[\"db_host\"] = \"localhost\"" || \'0A\'X || "gitlab_rails[\"db_database\"] = \"gitlabhq_production\"" || \'0A\'X || "gitlab_rails[\"db_username\"] = \"gitlab\""; ' ||,
              'ADDRESS system; ' ||,
              '"echo \"" config_content "\" >> /etc/gitlab/gitlab.rb"; ' ||,
              'configRC = RC; ' ||,
              'CHECKPOINT("CONFIG_COMPLETE", "phase=gitlab-config exitcode=" configRC); ' ||,
              'IF configRC \= 0 THEN EXIT configRC'

execute_rexx container=gitlab-ce-container script=configScript progress_callback=true timeout=60000
SAY "GitLab configuration updated (RC: " RC ")"

SAY ""
SAY "=== CHECKPOINT 9: Database Migration & Schema Setup ==="
CHECKPOINT('DATABASE_MIGRATION', '{"stage": "migration", "progress": 72, "description": "Running database migrations"}')

migrationScript = 'CHECKPOINT("MIGRATION_START", "phase=db-migrate"); ' ||,
                 'ADDRESS system; ' ||,
                 '"gitlab-ctl reconfigure"; ' ||,
                 'migrateRC = RC; ' ||,
                 'CHECKPOINT("MIGRATION_COMPLETE", "phase=db-migrate exitcode=" migrateRC); ' ||,
                 'IF migrateRC \= 0 THEN EXIT migrateRC'

execute_rexx container=gitlab-ce-container script=migrationScript progress_callback=true timeout=600000
SAY "Database migrations completed (RC: " RC ")"

SAY ""
SAY "=== CHECKPOINT 10: SSL Certificate Generation ==="
CHECKPOINT('SSL_CERTS', '{"stage": "ssl", "progress": 80, "description": "Generating SSL certificates"}')

sslScript = 'CHECKPOINT("SSL_START", "phase=ssl-certs"); ' ||,
           'ADDRESS system; ' ||,
           '"openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/gitlab.key -out /etc/ssl/certs/gitlab.crt -subj \"/C=US/ST=State/L=City/O=Organization/CN=localhost\""; ' ||,
           'sslRC = RC; ' ||,
           'CHECKPOINT("SSL_COMPLETE", "phase=ssl-certs exitcode=" sslRC); ' ||,
           'IF sslRC \= 0 THEN EXIT sslRC'

execute_rexx container=gitlab-ce-container script=sslScript progress_callback=true timeout=120000
SAY "SSL certificates generated (RC: " RC ")"

SAY ""
SAY "=== CHECKPOINT 11: GitLab Service Startup ==="
CHECKPOINT('SERVICE_START', '{"stage": "startup", "progress": 88, "description": "Starting GitLab services"}')

startupScript = 'CHECKPOINT("SERVICES_START", "phase=gitlab-startup"); ' ||,
               'ADDRESS system; ' ||,
               '"gitlab-ctl start"; ' ||,
               'startRC = RC; ' ||,
               'CHECKPOINT("SERVICES_STARTED", "phase=gitlab-startup exitcode=" startRC); ' ||,
               'IF startRC = 0 THEN DO; ' ||,
               '  "sleep 30"; ' ||,
               '  "gitlab-ctl status"; ' ||,
               '  statusRC = RC; ' ||,
               '  CHECKPOINT("SERVICES_STATUS", "phase=gitlab-status exitcode=" statusRC); ' ||,
               'END; ' ||,
               'ELSE EXIT startRC'

execute_rexx container=gitlab-ce-container script=startupScript progress_callback=true timeout=300000
SAY "GitLab services started (RC: " RC ")"

SAY ""
SAY "=== CHECKPOINT 12: Final Validation & Setup Complete ==="
CHECKPOINT('VALIDATION', '{"stage": "validation", "progress": 96, "description": "Validating GitLab installation"}')

validationScript = 'CHECKPOINT("VALIDATION_START", "phase=final-validation"); ' ||,
                  'ADDRESS system; ' ||,
                  '"gitlab-rake gitlab:check SANITIZE=true"; ' ||,
                  'checkRC = RC; ' ||,
                  'CHECKPOINT("VALIDATION_COMPLETE", "phase=final-validation exitcode=" checkRC); ' ||,
                  'IF checkRC = 0 THEN DO; ' ||,
                  '  CHECKPOINT("PROVISION_SUCCESS", "phase=complete progress=100 status=success"); ' ||,
                  '  SAY "GitLab CE provisioning completed successfully!"; ' ||,
                  'END; ' ||,
                  'ELSE DO; ' ||,
                  '  CHECKPOINT("PROVISION_WARNING", "phase=complete progress=100 status=warning"); ' ||,
                  '  SAY "GitLab CE installed but validation had warnings"; ' ||,
                  'END'

execute_rexx container=gitlab-ce-container script=validationScript progress_callback=true timeout=300000
SAY "Final validation completed (RC: " RC ")"

SAY ""
SAY "=== CHECKPOINT MONITORING STATUS ==="
checkpoint_status

SAY ""
SAY "=== CONTAINER PROCESS STATISTICS ==="
process_stats

SAY ""
SAY "=== SECURITY AUDIT LOG ==="
security_audit

SAY ""
SAY "=== GitLab CE Provisioning Summary ==="
SAY "✓ Ubuntu 22.04 container with security controls"
SAY "✓ PostgreSQL database configured"
SAY "✓ Redis cache server installed"
SAY "✓ GitLab CE package downloaded and installed"
SAY "✓ Database migrations completed"
SAY "✓ SSL certificates generated"
SAY "✓ GitLab services started and validated"
SAY ""
SAY "Total CHECKPOINT events: 12 major stages with ~30 sub-checkpoints"
SAY "Container resource usage: 4GB RAM, 2 CPU cores"
SAY "Estimated installation time: 10-20 minutes depending on network"
SAY ""
SAY "GitLab CE is now accessible at http://localhost"
SAY "Default admin username: root"
SAY "Initial admin password can be found with:"
SAY "  execute container=gitlab-ce-container command=\"cat /etc/gitlab/initial_root_password\""
SAY ""

-- Leave container running for access
SAY "Container 'gitlab-ce-container' left running for GitLab access"
SAY "To clean up later, run: cleanup all=true"
SAY ""
SAY "=== GitLab CE Provisioning Demo Complete ==="