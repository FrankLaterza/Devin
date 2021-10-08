// require the discord.js module
const fs = require('fs');
const WebRun = require('../WebRun.js');
// this imports the needed for specific websites
const wikiData = require('../command_info/wikipedia.json');
const { checkMods } = require('../mods/modCheck.js');
let modData = [];

module.exports = {
    name: 'wiki',
    description: 'gets a screenshot of the wiki page',
    args: true,
    cooldown: 55, // does nothing
    usage: 'link',
    channel: ['wiki-request', "wiki"],
    async execute(message, args, sessionInfo) {

        // await WebRun.launchProxieTest(sessionInfo);
        // return 0;

        // await WebRun.launchBrowserTest(args, sessionInfo);
        // return 0;

        // IF RETURN 1 THEN THE SEESION WILL BE DISABLED!!!! //
        // import the json files into here

        // if there are more than 1 arguments then there is a modifeir in the args obj
        if (args.length > 1) {
            // to check mods include usual and also the JSON of your site
            checkMods(args, wikiData, modData);
        }


        console.log(wikiData.introUrl);

        // checks if the url is a vaild url acccording to the webData
        if (!WebRun.checkURL(args, message, wikiData)) { return 0; }
        console.log('run web');
        return await WebRun.GetWeb(args[0], message, sessionInfo, modData, wikiData);
    },
};