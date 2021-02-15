'use strict';

const WebSocketServer=require('ws').Server;
const wss=new WebSocketServer({
    port: 8181
});

wss.on('connection', ws=> {
    console.log('Client connected.');
    ws.on('message', msg=> {
        console.log(msg);
    });
});