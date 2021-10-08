// require the discord.js module
const Discord = require('discord.js');
// eslint-disable-next-line no-unused-vars
const dotenv = require('dotenv').config();
const fs = require('fs');
const cron = require("cron");


// list varible names from config file
const { WhitelistChannel, WhitelistUser, Blacklist, prefix } = require('./config.json');
const { exeTask, taskQueue } = require('./Queue.js');
const GD_API = require('./GD_API.js');

// create a new Discord client
const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();


// this will read the filenames listed in your commands folder
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);

}

// this code is set up to run daily.
//       ***************                 ss mm hh d m y             //
const scheduledMessage = new cron.CronJob('00 00 09 * * *', () => {
    // This runs every day at 9:00:00 PST and 12:00:00 EST
    console.log('updateFiles!');
    GD_API.startGDUpdate(client);

    //OFFFF

});

//GD_API.startGDUpdate(client); // uncomment this line to test the good drive code
scheduledMessage.start(); // starts the schedule

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');

});

// login to Discord with your app's token
// client.login(process.env.TOKEN);
client.login(process.env.TOKEN2); // The token should be stored in your .env file

// this will run when a message is sent in the server form visable channels
client.on('message', message => {


    // the the mesage doesn't start with the prefix or was sent by the bot or the id was on the blacklist then ommit request
    if (!message.content.startsWith(prefix) || message.author.bot || Blacklist.includes(message.channel.id)) return;


    let args = message.content.slice(prefix.length).trim().split(/ +/); // gets  the arguments
    const commandName = args.shift().toLowerCase(); // sets command name to all lowercase
    const command = client.commands.get(commandName) || // command
        client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));


    if (!commandName) { return; } // if there is no command name then ommit request
    if (!command) { return; } // if there is no command name then ommit request
    if (!message.content) { return; } // if there is no message content then ommit request

    // if there is an specifc channel defined in the command file
    if (!WhitelistUser.includes(message.author.id) || !WhitelistChannel.includes(message.channel.id)) {
        if (command.channel != undefined && !command.channel.includes(message.channel.name)) {
            return;
        }
    }

    //!command.channel.includes(message.channel.name))

    // check for listed arguments
    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;
        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }
        return message.channel.send(reply);
    }
    console.log('command detected'); //shows a command was registed

    //COOL DOWN
    // veriable for the current time.
    const now = Date.now();

    // specific to commands that use the link usage!
    if (command.usage === 'link') {
        try {
            // need to update the taskQueue
            exeTask(message, args, command);
        } catch (error) {
            console.error(error);
            message.channel.send(`${message.author} in queue. Position: ${taskQueue.length}`);
        }
        return;
    } else {

        // normal cooldowns and commands
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Discord.Collection());
        }
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 5) * 1000;

        if (timestamps.has(message.channel.id)) {
            const expirationTime = timestamps.get(message.channel.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.channel.send(`${message.author} please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
            }
        }
        timestamps.set(message.channel.id, now);
        setTimeout(() => timestamps.delete(message.channel.id), cooldownAmount);
        try {
            command.execute(message, args);
        } catch (error) {
            console.error(error);
            message.channel.send(`There was an error with that command.`);
        }
    }
});

//%USERPROFILE%\AppData\Local\ms-playwright\firefox-1238\firefox
// ^^ this is where firefox is saved
//firefox -p  // this will open the profile manager under the firefox directory listed above