module.exports = {
    name: '-t',
    description: 'template mod',
    execute(args, message, modData) {


        //NOTE: this method is useful only when there a large amount of mods
        console.log("template mod detected");
        //create and change the value of a variable can be use in calling function
        modData.nameOfMod = true;

        return 0;;
    },
};