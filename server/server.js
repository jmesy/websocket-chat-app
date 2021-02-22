'use strict';

const fs=require('fs');
const WebSocket=require('ws');
const WebSocketServer=WebSocket.Server;
const wss=new WebSocketServer({
    port: 8080
});
const uuid=require('uuid');
const path=require('path');

function wsSend(resObject){
    for(const client in clients){
        const clientSocket=clients[client].ws;
        if(clientSocket.readyState==WebSocket.OPEN){
            clientSocket.send(JSON.stringify({
                type: resObject.type,
                id: resObject.clientUuid,//
                props: {
                    nickname: resObject.nickname,//
                    message: resObject.message
                }
            }));
        }
    }
}

//Load commands in the commands object.
const commands={};
fs
    .readdirSync(path.join(__dirname, 'commands'))//Use async.
    .forEach(val=> {
        const command=require(path.join(__dirname, `commands/${val}`));
        commands[command.name]=command;
    });

const clients={};

wss.on('connection', ws=> {
    const clientUuid=uuid.v4();
    let nickname=clientUuid.substring(0, 8);
    clients[clientUuid]={
        id: clientUuid,
        ws: ws,
        nickname: nickname
    };
    // console.log(`Client ${clientUuid} connected.`);

    const connectMessage=nickname+' has connected';
    wsSend({
        type: 'notification',
        id: clientUuid,
        nickname: clients[clientUuid].nickname,
        message: connectMessage
    });

    const handleCommand=function(message){
        const args=message
            .substring(prefix.length)
            .split(/ +/);
        const commandName=args
            .shift()
            .toLowerCase();
        // console.log(commandName, args);
        if(!args.length){
            return 'No arguments have been provided.';
        }
        // console.log(commands);
        if(commands.hasOwnProperty(commandName)){
            const command=commands[commandName]
            const res=command.execute(args, clients[clientUuid]);
            //Update changes to client.
            for(const property in res.client){
                clients[clientUuid][property]=res.client[property];
            }
            return res['Message'];
        }
    }

    const prefix='/';
    ws.on('message', msg=> {
        const msgObj=JSON.parse(msg);
        const {message}=msgObj;
        if(message.startsWith(prefix)){
            const resMessage=handleCommand(message);
            wsSend({
                type: 'notification',
                id: clientUuid,
                nickname: clients[clientUuid].nickname,
                message: resMessage
            });
        }
        else{
            wsSend({
                type: 'message',
                id: clientUuid,
                nickname: clients[clientUuid].nickname,
                message: message
            });
        }
    });

    ws.on('close', ()=> {
        const disconnectMessage=`${nickname} has left the chat.`;
        wsSend({
            type: 'notification',
            id: clientUuid,
            nickname: clients[clientUuid].nickname,
            message: disconnectMessage
        });
        delete clients[clientUuid];
    })
});

process.on('SIGINT', ()=> {
    console.log('Shutting down server');
    wsSend({
        type: 'notification',
        id: null,
        nickname: null,
        message: 'Server is down.'
    });
    process.exit();
});