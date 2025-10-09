/**
 * Application Registry for Cross-Platform Deployment
 * Defines reference applications that can be deployed to any environment
 *
 * Supported environments:
 * - Docker, Podman (containers)
 * - LXD, QEMU, nspawn, Firecracker, VirtualBox, Proxmox (VMs/containers)
 */

const APP_REGISTRY = {
  /**
   * Sinatra Hello World - Ruby web framework
   */
  'sinatra-hello': {
    name: 'Sinatra Hello World',
    language: 'ruby',
    runtime: 'ruby',
    description: 'Minimal Sinatra web app on port 4567',

    // Installation steps (distro-aware)
    install: {
      'debian': [
        'apt-get update',
        'apt-get install -y ruby ruby-dev build-essential',
        'gem install sinatra'
      ],
      'ubuntu': [
        'apt-get update',
        'apt-get install -y ruby ruby-dev build-essential',
        'gem install sinatra'
      ],
      'alpine': [
        'apk update',
        'apk add ruby ruby-dev build-base',
        'gem install sinatra'
      ],
      'rhel': [
        'yum install -y ruby ruby-devel gcc make',
        'gem install sinatra'
      ],
      'fedora': [
        'dnf install -y ruby ruby-devel gcc make',
        'gem install sinatra'
      ]
    },

    // Application code
    app: {
      'app.rb': `require 'sinatra'

set :bind, '0.0.0.0'
set :port, 4567

get '/' do
  "Hello from Sinatra! Running on \#{Socket.gethostname}"
end

get '/health' do
  content_type :json
  { status: 'ok', hostname: Socket.gethostname }.to_json
end
`
    },

    // Start command
    start: 'ruby app.rb',

    // Port
    port: 4567,

    // Health check
    healthCheck: 'curl -s http://localhost:4567/health'
  },

  /**
   * Express.js Hello World - Node.js web framework
   */
  'express-hello': {
    name: 'Express.js Hello World',
    language: 'javascript',
    runtime: 'node',
    description: 'Minimal Express web app on port 3000',

    install: {
      'debian': [
        'apt-get update',
        'apt-get install -y nodejs npm'
      ],
      'ubuntu': [
        'apt-get update',
        'apt-get install -y nodejs npm'
      ],
      'alpine': [
        'apk update',
        'apk add nodejs npm'
      ],
      'rhel': [
        'yum install -y nodejs npm'
      ],
      'fedora': [
        'dnf install -y nodejs npm'
      ]
    },

    app: {
      'package.json': `{
  "name": "express-hello",
  "version": "1.0.0",
  "main": "app.js",
  "dependencies": {
    "express": "^4.18.0"
  }
}`,
      'app.js': `const express = require('express');
const os = require('os');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(\`Hello from Express! Running on \${os.hostname()}\`);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', hostname: os.hostname() });
});

app.listen(port, '0.0.0.0', () => {
  console.log(\`Express app listening on port \${port}\`);
});
`
    },

    setup: ['npm install'],
    start: 'node app.js',
    port: 3000,
    healthCheck: 'curl -s http://localhost:3000/health'
  },

  /**
   * Flask Hello World - Python web framework
   */
  'flask-hello': {
    name: 'Flask Hello World',
    language: 'python',
    runtime: 'python3',
    description: 'Minimal Flask web app on port 5000',

    install: {
      'debian': [
        'apt-get update',
        'apt-get install -y python3 python3-pip',
        'pip3 install flask'
      ],
      'ubuntu': [
        'apt-get update',
        'apt-get install -y python3 python3-pip',
        'pip3 install flask'
      ],
      'alpine': [
        'apk update',
        'apk add python3 py3-pip',
        'pip3 install flask'
      ],
      'rhel': [
        'yum install -y python3 python3-pip',
        'pip3 install flask'
      ],
      'fedora': [
        'dnf install -y python3 python3-pip',
        'pip3 install flask'
      ]
    },

    app: {
      'app.py': `from flask import Flask, jsonify
import socket

app = Flask(__name__)

@app.route('/')
def hello():
    return f"Hello from Flask! Running on {socket.gethostname()}"

@app.route('/health')
def health():
    return jsonify(status='ok', hostname=socket.gethostname())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
`
    },

    start: 'python3 app.py',
    port: 5000,
    healthCheck: 'curl -s http://localhost:5000/health'
  }
};

/**
 * Get application definition
 */
function getApp(appId) {
  const app = APP_REGISTRY[appId];
  if (!app) {
    throw new Error(`Application not found: ${appId}. Available: ${Object.keys(APP_REGISTRY).join(', ')}`);
  }
  return app;
}

/**
 * List all available applications
 */
function listApps() {
  return Object.keys(APP_REGISTRY).map(id => ({
    id,
    name: APP_REGISTRY[id].name,
    language: APP_REGISTRY[id].language,
    runtime: APP_REGISTRY[id].runtime,
    description: APP_REGISTRY[id].description,
    port: APP_REGISTRY[id].port
  }));
}

/**
 * Detect OS distribution
 */
function detectDistro(osRelease) {
  osRelease = osRelease.toLowerCase();
  if (osRelease.includes('debian')) return 'debian';
  if (osRelease.includes('ubuntu')) return 'ubuntu';
  if (osRelease.includes('alpine')) return 'alpine';
  if (osRelease.includes('rhel') || osRelease.includes('red hat')) return 'rhel';
  if (osRelease.includes('fedora')) return 'fedora';
  if (osRelease.includes('centos')) return 'rhel';  // CentOS uses yum like RHEL
  return 'debian';  // Default fallback
}

module.exports = {
  APP_REGISTRY,
  getApp,
  listApps,
  detectDistro
};
