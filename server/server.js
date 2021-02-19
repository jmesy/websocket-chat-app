'use strict';

const WebSocket=require('ws');
const WebSocketServer=WebSocket.Server;
const wss=new WebSocketServer({
    port: 8080
});
const uuid=require('uuid');

const clients=[];

function wsSend(type, clientUuid, nickname, message){
    for(let i=0; i<clients.length; ++i){//No point in for/of as it creates another variable ans is less readable.
        const clientSocket=clients[i].ws;
        if(clientSocket.readyState===WebSocket.OPEN){//Send message to all available clients.
            clientSocket.send(JSON.stringify({
                type: type,
                id: clientUuid.substr(0, 8),//Message is related to this client.
                // nickname: nickname,
                // message: message
                props: {
                    nickname: nickname,
                    message: message
                }
            }));
        }
    }
}

let clientIndex=1;

wss.on('connection', ws=> {
    const clientUuid=uuid.v4();
    // let nickname='Anonymous'+clientIndex;
    let nickname=clientUuid.substring(0, 8);
    clientIndex+=1;
    clients.push({//Have a subobject to send via weSend.//This object should be made available locally.
        id: clientUuid,
        ws: ws,
        nickname: nickname
    });
    console.log(`Client ${clientUuid} connected.`);

    const connect_message=nickname+' has connected';
    wsSend('notification', clientUuid, nickname, connect_message);

    ws.on('message', message=> {
        message=JSON.parse(message);
        message=message.message;
        //Use switch or refer to Discord bot.
        if(message.indexOf('/nick')==0){
            message=message.trim();//'/nick  James ' -> '/nick  James'.
            const nicknameArray=message.split(' ');//['/nick', '', 'James'].
            let responseMessage=`Nick reassignement unsuccesful.`;
            if(nicknameArray.length>=2){
                const old_nickname=nickname;
                nickname=nicknameArray.pop();//'James'.
                for(let i=0; i<clients.length; ++i){//Update clients array.
                    if(clients.nickname==old_nickname){
                        clients.nickname=nickname;
                        break;
                    }
                }
                responseMessage=`Client ${old_nickname} changed to ${nickname}.`;
            }
            wsSend('nick_update', clientUuid, nickname, responseMessage);
            //Having this in a function simplifies it with return statements.
        }
        else{
            wsSend('message', clientUuid, nickname, message);
        }
    });

    ws.on('close', ()=> {
        const disconnectMessage=`${nickname} has left the chat.`;
        wsSend('notification', clientUuid, nickname, disconnectMessage);
        for(let i=0; i<clients.length; ++i){
            if(clients[i].id==clientUuid){
                clients.splice(i, 1);
                break;
            }
        }
    })
});

process.on('SIGINT', ()=> {
    console.log('Shutting down server');
    wsSend('notification', null, null, 'Server is down.');//Improve wsSend() structure.
    process.exit();
});