//return 0 run means that the task is sucefully complete
const fs = require('fs');

let mods = [];
const modFiles = fs.readdirSync('./mods').filter(file => file.endsWith('.js'));
for (const file of modFiles) {
    const mod = require(`../mods/${file}`);
    mods.push(mod);
}

function checkMods(args, message, modData, jsonData) {

    //check is there are any mods aviable
    //console.log("checking mods");

    if (args.some(r => jsonData.modList.indexOf(r) >= 0)) {

        for (let i = args.length - 1; i > 0; i--) {
            //console.log(args[i]);
            const aviableMod = mods.find(({ name }) => name === args[i].toString());
            if (aviableMod != undefined) {
                aviableMod.execute(args, message, modData);
            }

            // gets rid of the argument from the string
            args.pop();
            //console.log("filtered " + args);

        }
    }
}




module.exports = { checkMods };