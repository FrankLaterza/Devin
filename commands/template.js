// include this if your function has mods 
const { checkMods } = require('../mods/modCheck.js');
//const siteData = require('../sites/wikipedia.json');
// site data                // the to site
let modData = [];


module.exports = {
    name: 'template',
    description: 'this is a template',
    cooldown: 1,
    args: true,

    execute(message, args) {


        //uncomment if you have mods
        //checkMods(args, siteData, modData);



    },
};