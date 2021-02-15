'use strict';

const WebSocketServer=require('ws').Server;
const wss=new WebSocketServer({
    port: 8181
});
const uuid=require('uuid');

const clients=[];

//This is executed once at every new connection.
wss.on('connection', ws=> {
    //If the client stops running and then reconnects, that counts as a new connection.
    const clientUuid=uuid.v4();
    clients.push({
        id: clientUuid,
        ws: ws
    });
    console.log(`Client ${clientUuid} connected.`);

    ws.on('message', msg=> {
        for(let i=0; i<clients.length; ++i){
            const clientSocket=clients[i].ws;
            // console.log(`Client ${clients[i].id}: ${message}`);
            clientSocket.send(JSON.stringify({
                id: clientUuid,
                message: msg
            }));
        }
    })
});