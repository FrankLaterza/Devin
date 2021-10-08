module.exports = {
    name: 'echo',
    description: 'delete message and reprad args',
    cooldown: 1,
    args: true,
    execute(message, args) {


        console.log('echo command ' + args);
        message.delete({ timeout: 0 });
        message.channel.send(message.content.substring(6));
        return 0;


    },
};