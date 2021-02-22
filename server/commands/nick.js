'use strict';

exports.name='nick';
exports.execute=(args, client)=>{
    const oldNickname=client.nickname;
    client.nickname=args[0];
    const res={};
    res.Message=`Client ${oldNickname} changed to ${client.nickname}`;
    res.client=client;
    return res;
}