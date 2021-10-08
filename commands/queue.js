const { taskQueue } = require('../queue.js');

module.exports = {
    name: 'queue',
    description: 'Check queue',
    cooldown: 5,
    aliases: 'q',
    channel: ['wiki'],
    execute(message, args) {


        message.channel.send(`${message.author} Queue length is ${taskQueue.length}`);



        return;
    },
};