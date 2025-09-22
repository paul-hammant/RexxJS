-- Idempotent: safe to re-run. Expects HOST and USER as positional args.

REQUIRE "./extras/addresses/remote/address-ssh.js"

PARSE ARG HOST, USER

SAY 'Installing Docker on ' || USER || '@' || HOST

ADDRESS ssh
connect host=HOST user=USER id=docker-install

SAY 'Starting Docker install with 5min timeout...'
ADDRESS ssh
exec command='sh -lc "set -e; echo \"[docker-install] starting on $(hostname) for user paul\"; if ! command -v docker >/dev/null 2>&1; then sudo apt-get update -y && sudo apt-get install -y docker.io && sudo systemctl enable --now docker || true && sudo usermod -aG docker paul || true; fi; echo \"[docker-install] touching install marker in home\"; touch ~/rexxjs-docker-install.ok || true"' timeout=300000

SAY 'Docker install completed'

ADDRESS ssh  
close id=docker-install
