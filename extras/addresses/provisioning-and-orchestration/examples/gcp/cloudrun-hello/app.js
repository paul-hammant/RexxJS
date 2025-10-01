/**
 * Simple Hello World Cloud Run service
 * Minimal Node.js HTTP server for testing Cloud Run deployment
 */

const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Hello from RexxJS Cloud Run!',
    timestamp: new Date().toISOString(),
    service: 'cloudrun-hello',
    path: req.url,
    method: req.method
  }, null, 2));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
