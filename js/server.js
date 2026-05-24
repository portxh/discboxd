const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;
const directoryName = path.join(__dirname, '..');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log(`request starting for ${req.url}`);

    let requestedPath = req.url === '/' ? 'index.html' : req.url;
    try {
        requestedPath = decodeURIComponent(requestedPath);
    } catch (e) {
        res.writeHead(400);
        res.end('Bad Request');
        return;
    }
    
    // Validate path explicitly against traversal attempts before doing any fs operations
    if (requestedPath.includes('..') || requestedPath.includes('\0')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    let filePath = path.join(directoryName, requestedPath);
    const normalizedPath = path.normalize(filePath);
    
    if (!normalizedPath.startsWith(directoryName)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    const extname = String(path.extname(normalizedPath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(normalizedPath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('404 Not Found', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });

});

server.listen(port, () => {
    console.log(`Server running at http://127.0.0.1:${port}/`);
});
