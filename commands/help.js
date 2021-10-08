module.exports = {
    name: 'help',
    description: 'Help for the user',
    cooldown: 5,
    execute(message, args) {

        message.channel.send('Devin is a webscraping discord bot. Try `-wiki` followed by a wikipedia link to try it out.');
        // const channelList = module.exports.channel;

    },
};