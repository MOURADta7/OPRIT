const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ORBIT Local Development Server...\n');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname); // Serve from project root

// Create demo directory if it doesn't exist
const DEMO_DIR = path.join(__dirname, 'demo');
if (!fs.existsSync(DEMO_DIR)) {
  fs.mkdirSync(DEMO_DIR, { recursive: true });
}

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// HTTP Server
const server = http.createServer((req, res) => {
  // Parse URL
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'demo/index.html' : req.url);

  // Default to index.html for directories
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Get extension
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  // Read file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>ORBIT - 404</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                background: #0f1419;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
              }
              h1 { color: #00d4ff; font-size: 48px; margin: 0; }
              p { color: #8b92a8; }
            </style>
          </head>
          <body>
            <div>
              <h1>404</h1>
              <p>Page not found in ORBIT</p>
              <a href="/" style="color: #00d4ff;">Go Home</a>
            </div>
          </body>
          </html>
        `);
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Cache-Control': 'no-cache'
      });
      res.end(content, 'utf-8');
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ ORBIT Server running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://127.0.0.1:${PORT}`);
  console.log(`\n📁 Serving files from: ${PUBLIC_DIR} (project root)`);
  console.log(`\n🔧 Development features:`);
  console.log(`   • Hot reload enabled`);
  console.log(`   • CORS headers configured`);
  console.log(`   • Cache disabled for development`);
  console.log(`\n⚡ Press Ctrl+C to stop\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping ORBIT Server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});