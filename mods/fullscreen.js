module.exports = {
    name: '-f',
    description: 'full screenshot screen shot',
    execute(args, message, modData) {

        console.log("full screenshot mod detected");
        modData.fullScreenshot = true;

        return modData;
    },
};