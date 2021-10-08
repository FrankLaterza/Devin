const { alertDev } = require('../WebRun.js');
module.exports = {
    name: 'bug',
    description: 'alert dev',
    cooldown: 3600,
    args: true,
    execute(message, args) {


        console.log(message.author.username);

        console.log('*************BUG REPORTED:*************' + args);
        //console.log('from channel: ' + message.channel.name + '\nfrom user: ' + message.author);

        alertDev(message);

        message.channel.send(`${message.author} message sent`);

    },
};