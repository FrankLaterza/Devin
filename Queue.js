const { taskPool } = require('./config.json');
const https = require('https');
const { alertDev } = require('./WebRun.js');
// successful runs and cooldown will work toggeteger
let taskArray = taskPool; // my be redundant
let taskQueue = [];

// this set is for the queue.. subject to move
for (let index = 0; index < taskArray.length; index++) {
    taskArray[index].successfulRun = 0; // make all sucessfulRun objects 0
}


async function waitForRet(message, args, sessionInfo, command) {

    console.log('running task');
    const succesfulRunCheck = await command.execute(message, args, sessionInfo);
    console.log('task done');

    // this condition will be check after command executed
    // if succesfulRunCheck is still zero then then the
    // task will be deleted from taskArray
    if (succesfulRunCheck) {
        // this should remove the task that gives an error??GOOD!!!
        taskArray = taskArray.filter(value =>
            !value.sessionDir.includes(sessionInfo.sessionDir));

        // checks aviable commands and
        const numberOfSites = commandAvailableList(command, message);
        if (!numberOfSites) { /*do nothing*/ } else {

            message.channel.send(`${message.author} Trying again`);

            exeTask(message, args, command);

            return 0;
        }

    } else {
        // stores the return of the run
        // this method can be used to disable tasks that return a 1
        // check that this is NOT undefined at all times!!!!
        sessionInfo.successfulRun = succesfulRunCheck;
    }

    // this will check the tasks
    if (taskQueue.length > 0) {
        console.log('returned and running frist queue');
        exeTask(taskQueue[0].message, taskQueue[0].args, taskQueue[0].command);
        taskQueue.shift(); // removes first element of array!
    }

}

function addQueue(message, args, command) {

    if (taskQueue.length > 6) {
        message.channel.send(`${message.author} Queue full. Your request wasn't added.`);
    } else {

        taskQueue.push({ 'args': args, 'message': message, 'command': command });
        console.log('queue added')
        message.channel.send(`${message.author} in queue. Position: ${taskQueue.length}`);
    }
}

function exeTask(message, args, command) {

    // checks aviable commands and;
    const numberOfSites = commandAvailableList(command, message);
    if (!numberOfSites) { return 0; }

    let siteCount = 0; // reset the inc

    // go through all elements in the taskArray
    for (let index = 0; index < taskArray.length; index++) {

        // if the command name isn't included in the sites list then move skip the loop
        if (!taskArray[index].sites.includes(command.name)) { continue; } // format help

        // if task is in use
        if (!taskArray[index].successfulRun) {
            try {
                //try to run task on aviable command
                waitForRet(message, args, taskArray[index], command); // pass these to an async func to get ran
                //put task in use
                taskArray[index].successfulRun = 1;
                // set cool down
            } catch (error) {
                console.error(error);
                message.channel.send(`${message.author} there was an error trying to execute that command!`);
            }
            break;
        } else {
            // if task check fail then inc the counter
            siteCount++;

        }
    }

    // all tasks are full then add to queue
    if (siteCount >= numberOfSites) {
        console.log('all tasks full');
        addQueue(message, args, command);
    }

    taskArray.push(taskArray.shift()); // this cycles the array to keep requests fresh :)

    console.log(taskQueue.length);

    return 0; // exit funct

}


//available command list
function commandAvailableList(command, message) {
    // this can also be used to filter out the full arrays for aviable site names... removve .length
    const numberOfSites = taskArray.filter(e => e.sites.includes(command.name)).length;

    // if there are no tasks avaible for command/site then ping dev and cancel task
    if (!numberOfSites) {
        message.channel.send(`${message.author} All tasks for -${command.name} are temporarily unavailable. Developer Notified`);

        // remove all commands that are now unaviable
        taskQueue = taskQueue.filter(e => e.command.name !== (command.name));

        alertDev("null");
    }

    return numberOfSites;

}


module.exports = { taskQueue, taskArray, exeTask };