const http = require('http');
const url = require('url');
const fs = require('fs');
const newWS = new require('ws');
const ipc = require('node-ipc');

http.createServer(function (req, res) {
    let reqList = url.parse(req.url, true);
    let filePath = '.' + reqList.pathname;
    if (filePath === "./arkanoid.html") {
        console.log(filePath);
        fs.readFile(filePath, function (err, data) {
            if (err) {
                res.writeHead(404, {'Content-Type': 'text/html'});
                return res.end('404 Not Found');
            }
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            return res.end();
        });
    } else if (filePath === "./mainMenu.html") {
        fs.readFile(filePath, function (err, data) {
            if (err) {
                res.writeHead(404, {'Content-Type': 'text/html'});
                return res.end('404 Not Found');
            }
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            return res.end();
        });
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('404 Not Found');
    }
}).listen(1234);

let webSS = new newWS.Server({
    port:1235
});

webSS.on('connection', function(ws) {
    var ipc=require('node-ipc');
    ipc.config.id   = 'hello';
    ipc.config.retry= 1000;
    ipc.connectTo('world', function () {
        ws.on('message', function (message) {
            let userData = JSON.parse(message);
            if (userData.command == "move") {
                ipc.of.world.emit('message', JSON.stringify({com: "move", x: userData.x}));
            } else if (userData.command == "pause") {
                ipc.of.world.emit('message', JSON.stringify({com: "pause"}));
            } else if (userData.command == "continue") {
                ipc.of.world.emit('message', JSON.stringify({com: "continue"}));
            } else if (userData.command == "exit") {
                ipc.of.world.emit('message', JSON.stringify({com: "exit"}));
            }
            ws.send(JSON.stringify());
        });
        ipc.of.world.on('connect', function () {
            ipc.log('## connected to world ##'.rainbow, ipc.config.delay);
        });
        ipc.of.world.on('disconnect', function () {
            ipc.log('disconnected from world'.notice);
        });
        ipc.of.world.on('message', function (data) {
            ws.send(data);
        });
    });
});