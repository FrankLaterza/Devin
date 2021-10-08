module.exports = {
    name: '-i',
    description: 'deletes user name and deletes request message',
    execute(args, message, modData) {

        console.log("incognito mod detected");

        // delete message and nireplace the user as nothing
        message.delete({ timeout: 0 });
        message.author = '';

        return modData;
    },
};