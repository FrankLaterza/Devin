const { MessageAttachment } = require('discord.js');
const fs = require('fs');
const { checkMods } = require('../mods/modCheck.js');

const MemeFolderPath = ['PUT THE PATH TO YOUR MEME FOLDER HERE'];


module.exports = {
    name: 'meme',
    description: 'memes bro!',
    cooldown: 5,
    channel: [],
    execute(message, args) {



        const path = fs.readdirSync(MemeFolderPath); /* now files is an Array of the name of the files in the folder and you can pick a random name inside of that array */
        const chosenFile = path[Math.floor(Math.random() * path.length)];

        // Check that the file exists locally
        if (!fs.existsSync(MemeFolderPath + chosenFile)) {

            // this will find a channle called "bot-logs"
            message.channel.send('Sorry, an error has occurred');
            //message.client.channels.get('833025216061636638').send(error);
            const channel1 = message.guild.channels.cache.find(channel1 => channel1.name === 'bot-logs');
            message.client.channels.cache.get(channel1.id).send('Error, File path ' + chosenFile + ' does not exist ');
            return 0;

        }

        // The file *does* exist
        else {

            const attachment = new MessageAttachment(MemeFolderPath + chosenFile);
            message.channel.send(attachment);

            console.log('meme sent');

            return 1;
        }

    }


};