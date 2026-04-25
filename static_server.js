const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './咕噜_world.html';
    
    const ext = path.extname(filePath);
    const ct = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'};
    
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, {'Content-Type': ct[ext] || 'text/plain'});
        res.end(data);
    });
});
server.listen(80, '0.0.0.0', () => console.log('OK'));
