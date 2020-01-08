const ipc = require('node-ipc');
/*======================description_for_heatboxes======================*/
const ballRadius = 5;
/*===========================game_structures===========================*/
const startXCoord = 400;
const startYCoord = 920;
const speedX = 1;
const speedY = -1;
let speed = 0;

directionR = {
    x: speedX,
    y: speedY,
};
locationR = {
    x: startXCoord,
    y: startYCoord,
};
blocks = [
    {
        x: 600,
        y: 940,
        width: 100,
        height: 10,
        health: 2,
    }
];
/*---------------------------------------------------------------------*/
let physics_update = function () {
    for (let i = 0; i < blocks.length; i++)
        if (check_intersection(blocks[i]))
            if (i != 0 && --blocks[i].health <= 0)
                blocks.splice(i, 1);
    locationR.x += directionR.x;
    locationR.y += directionR.y;
    if (locationR.x <= 0 || locationR.x >= 1000) {
        directionR.x *= -1;
    }
    if (locationR.y <= 0)
        directionR.y *= -1;
    if (locationR.y >= 1000) {
        directionR.x = 0;
        directionR.y = 0;
        locationR.y -= 1;

    }
};
/*===========stable_physics_update||floating_graphics_update===========*/
let f = function() {
    for (let i = 0; i < speed; i++)
        physics_update();
};
/*---------------------------------------------------------------------*/
let check_intersection = function (block) {
    //                 |
    //        1        |         2
    //                 |
    //----------center of block----------
    //                 |
    //        4        |         3
    //                 |
    let centersDistanceX = Math.abs(locationR.x - block.x);
    let requiredDistanceX = block.width + ballRadius;
    let centersDistanceY = Math.abs(locationR.y - block.y);
    let requiredDistanceY = block.height + ballRadius;
    if ((requiredDistanceX >= centersDistanceX) && (requiredDistanceY >= centersDistanceY)) {
        if ((locationR.y < block.y) && (locationR.x > block.x))
            return sideConnection(block, 2); // 2 - second part
        else if ((locationR.y > block.y) && (locationR.x > block.x))
            return sideConnection(block, 3); // 3 - third part
        else if ((locationR.y > block.y) && (locationR.x < block.x))
            return sideConnection(block, 4); // 4 - fourth part
        else if ((locationR.y < block.y) && (locationR.x < block.x))
            return sideConnection(block, 1); // 1 - first part
    }
    return 0;
};
/*---------------------------------------------------------------------*/
let sideConnection = function (block, part) {
    let ballX, ballY, blockX, blockY;
    if (part == 2) {
        ballX = locationR.x - ballRadius;
        ballY = locationR.y + ballRadius;
        blockX = block.x + block.width;
        blockY = block.y - block.height;
    } else if (part == 3) {
        ballX = locationR.x - ballRadius;
        ballY = locationR.y - ballRadius;
        blockX = block.x + block.width;
        blockY = block.y + block.height;
    } else if (part == 4) {
        ballX = locationR.x + ballRadius;
        ballY = locationR.y - ballRadius;
        blockX = block.x - block.width;
        blockY = block.y + block.height;
    } else {
        ballX = locationR.x + ballRadius;
        ballY = locationR.y + ballRadius;
        blockX = block.x - block.width;
        blockY = block.y - block.height;
    }
    if (Math.abs(ballX - blockX) > Math.abs(ballY - blockY))
        directionR.y *= -1;
    else if (Math.abs(ballX - blockX) < Math.abs(ballY - blockY))
        directionR.x *= -1;
    else
        return 0;
    return 1;
};

let prepareGame = function (width, height) {
    locationR.x = startXCoord;
    locationR.y = startYCoord;
    directionR.x = speedX;
    directionR.y = speedY;
    let columns = width / (80 + 10) - 1;
    let rows = height / (40 + 10) - 5;
    for (let i = 1; i <= columns; i++) {
        for (let j = 1; j <= rows; j++){
            blocks.push({
                x: i * 80 + (i * 10),
                y: j * 40 + (j * 10),
                width: 40,
                height: 20,
                health: 2
            });
        }
    }
};

prepareGame(1000, 1000);
setInterval(f, 34);

ipc.config.id   = 'world';
ipc.config.retry= 1000;
ipc.serve(function () {
        ipc.server.on('message', function (data, socket) {
                let jsonD = JSON.parse(data);
                if (jsonD.com === "start") {
                    speed = 6;
                } else if (jsonD.com === "move") {
                    blocks[0].x = jsonD.x;
                } else if (jsonD.com === "pause") {
                    speed = 0;
                } else if (jsonD.com === "continue") {
                    speed = 6;
                } else if (jsonD.com === "exit") {
                    directionR.x = 0;
                    directionR.y = 0;
                    speed = 0;
                }
                ipc.server.emit(socket, 'message', JSON.stringify({blks: blocks, bx: locationR.x, by: locationR.y}));
        });
        ipc.server.on('socket.disconnected', function(socket, destroyedSocketID) {
                ipc.log('client ' + destroyedSocketID + ' has disconnected!');
            });
    });
ipc.server.start();