module.exports = {
    name: '-o',
    description: 'overrides saftey features',
    execute(args, message, modData) {
        console.log("override mod detected");
        modData.safteyOveride = true;

        return modData;
    },
};