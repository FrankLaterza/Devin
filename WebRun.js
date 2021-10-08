const { MessageAttachment } = require('discord.js');
const { firefox } = require('playwright');
const fs = require('fs');
const validUrl = require('valid-url');
const https = require('https');
const fetch = require('node-fetch');
const { taskPool } = require('./config.json');


// this is the cooldown per task
const browserCooldown = 30; // half minute
let browserTimeout = 0;
//const {USERNAME2, PASSWORD2} = require('../config.json');

// this will check to see if the link is an aviable url
function checkURL(args, message, webData) {

    args = args.toString();
    let urlFound = false;
    //console.log('args is ' + args.includes(webData.introUrl.toString()));
    const starterCheck = args.includes(webData.introUrl.toString())
    if (starterCheck && validUrl.isUri(args)) {
        console.log('valid url detected');
        args = args.split('redirect=').pop(); // this will get rid of the redirect // not tested for ch
        urlFound = true;
    } else {
        console.log('Not a URL');
    }

    // annoying flag
    if (urlFound) { return 1; } // return a succesful found link
    else { message.channel.send('Invaild URL try ``-help`` more options'); return 0; }

}


async function launchProxieTest() {

    const profileIndex = 0;

    const userDataDir = taskPool[profileIndex].sessionDir;
    const browser = await firefox.launchPersistentContext(userDataDir, {
        headless: false,
        //proxy: taskPool[profileIndex].proxy,
        slowMo: 2000,
    });

    const page = await browser.newPage();
    await page.waitForTimeout(10000);

    return 0;


}

async function launchBrowserTest(url, sessionInfo) {

    const page = await contextHandel(sessionInfo);
    const browser = sessionInfo.context;
    await page.goto('https://www.google.com');
    await page.waitForTimeout(10000);

    return 1;
}


async function contextHandel(sessionInfo) {
    // set a timeout to clear everything! will clear out everyting in this context!
    clearTimeout(browserTimeout);
    browserTimeout = setTimeout(async function() {
        await sessionInfo.context.close();
        // delete the seesion context
        sessionInfo.page = undefined;
        sessionInfo.context = undefined;
        console.log('closing browser');
    }, 3600000); // 1 hour


    // **** add a condition to check for a crashed browser ****

    ///3600000
    // if context is cleared then create a new one!
    if (sessionInfo.context === undefined) {
        console.log("no browser found, opening new");
        return newBroswerContext(sessionInfo);
    }
    // if non apply then carry on with the new tab!!!
    else {
        console.log('context found');
        return sessionInfo.page;
    }
}

async function newBroswerContext(sessionInfo) {
    const userDataDir = sessionInfo.sessionDir;
    const browser = await firefox.launchPersistentContext(userDataDir, {
        headless: false,
        //proxy: sessionInfo.proxy,
        slowMo: 2000,
    });

    const page = await browser.newPage();
    // save the context into the object!
    sessionInfo.context = browser;
    sessionInfo.page = page;

    return sessionInfo.page;
}


async function GetWeb(url, message, sessionInfo, modData, webData) {

    // check if image has been sent before to limit requests
    // code will not run if past link is found

    // this sends a random message when start .. list imposted from the textArrayStart list
    const randomNumber = Math.floor(Math.random() * textArrayStart.length);

    // saftey flag is for ommiting safty features or taking full screen shots
    if (modData.safteyOveride || modData.fullScreenshot) {
        message.channel.send(textArrayStart[randomNumber] + ' ... Overriding');
        modData.safteyOveride = findAndReplace(url, modData.safteyOveride);

    } else { // check for link and remove
        message.channel.send(textArrayStart[randomNumber]);
        //checks the data base for any exising links 
        if (checkExistingFiles(url, message))
            return 0;
    }
    // run web

    const page = await contextHandel(sessionInfo);
    // const browser = sessionInfo.context;
    try {
        await page.goto(url.toString());
        await page.waitForTimeout((Math.random() * 1000) + 500);

        // this element should be a known element for every page login
        const loginCheck = await page.$(webData.successCheckElement.toString()); // promise with element

        if (loginCheck) {
            // this will just take a screen shot of the page 
            if (modData.fullScreenshot) {
                await page.screenshot({ path: 'temp_image.png', fullPage: true });
                const image = fs.readFileSync('./temp_image.png');
                const attachment = new MessageAttachment(image);
                await message.channel.send(`${message.author}`, attachment);
            } else {

                for (let i = 0; i < webData.hideElement.length; i++) {
                    await page.$eval(webData.hideElement[i].toString(), element => element.style.visibility = "hidden"); // hides element
                }
                // this variable will store an array of images 
                let imageUrlArray = [];
                for (let i = 0; i < webData.screenshotElements.length; i++) {
                    /// add text book check!!!
                    const elementCheck = await page.$(webData.screenshotElements[i].toString()); // promise with element
                    if (elementCheck) {
                        // const elementHandle = await page.$('.answers-list');
                        await elementCheck.screenshot({ path: 'temp_image.png' });
                        console.log('Element Found!');

                        // take a screen shot and send image
                        const image = fs.readFileSync('./temp_image.png');
                        const attachment = new MessageAttachment(image);
                        //this will ping the user everytime a image is found
                        //const imageUrl = await message.channel.send(`${message.author}`, attachment);
                        const imageUrl = await message.channel.send(attachment).then(function(msg) { return msg.attachments.first().url; });
                        imageUrlArray[i] = imageUrl;

                    } else {
                        //await page.screenshot({ path: 'temp_image.png', fullPage: true });
                        //message.channel.send('Link vaild, but not supported.\n If you think this answer should have been supported, use ``-bug`` command to notify developer.');
                        message.channel.send('This element could not be found.');
                        console.log('***************No Element Found***************');
                    }

                }
                if (modData.safteyOveride === undefined) {
                    saveToJson(url, imageUrlArray); // save the urldata
                }
                //pings user when everything is done!
                await message.channel.send(`${message.author}`);
            }
        } else {

            await page.screenshot({ path: 'temp_image.png', fullPage: true });

            message.channel.send('Unexpected behaviour. Developer Notified');
            const image = fs.readFileSync('./temp_image.png');
            const attachment = new MessageAttachment(image);
            await message.channel.send(`${message.author}`, attachment);
            alertDev(message);
            console.log('***************ERROR ON PAGE***************');
            //return 0; // return 1 for error shutdown
        }
        console.log('info sent!');
        // this sends a random message when done .. list imposted from the textArrayDone list
        const randomNumber = Math.floor(Math.random() * textArrayDone.length);
        message.channel.send(textArrayDone[randomNumber]);
        await page.waitForTimeout(((Math.random() * 10) + browserCooldown) * 1000);


        return 0;

    } catch (error) {
        console.log(error);
        // this will find a channle called "bot-logs"
        message.channel.send('Error.  Developer Notified');
        alertDev(message);
        console.log('***************Gernaric Error***************');

        const channel1 = message.guild.channels.cache.find(e => e.name === 'bot-logs');
        if (!channel1) return;
        channel1.send('error' + error);

        return 1;

    }

}





function checkExistingFiles(url, message) {

    const info = fs.readFileSync('./past_links.json');
    const infoJson = JSON.parse(info);
    const searchresults = infoJson.find((index) => index.link === url.toString());

    //this method uses a comma to split the imageUrl data, not the best solution
    // if results found
    if (searchresults) {
        const linkVerify = urlCheck(searchresults.imageUrl);
        const imageUrlArr = searchresults.imageUrl.split(',');
        if (linkVerify) { // image found
            console.log('link found');
            message.channel.send(`${message.author} Ooo! I know this one!`);
            for (let i = 0; i < imageUrlArr.length; i++) { message.channel.send(imageUrlArr[i]); }
            message.channel.send("if this answer doesn't match, try the ``-o`` modifier for a restart! \n");
            return 1;

        } else if (!linkVerify) { // image link bad..
            console.log('attempting to remove json');
            removeJson(searchresults.link); // remove
            return 0;
        }
    } else {

        console.log("no existing image found");
        return 0;

    }
}


function findAndReplace(url, safteyFlag) {

    if (!safteyFlag) {
        const info = fs.readFileSync("./past_links.json");
        const infoJson = JSON.parse(info);
        const funt = (element) => element === url;
        const indexRes = infoJson.findIndex(funt);
        const searchresults = infoJson.find((index) => index.link === url.toString());

        if (searchresults) {
            console.log('removing');
            infoJson.splice(indexRes, 1);
            fs.writeFile("./past_links.json", JSON.stringify(infoJson), function(err) {
                if (err) throw err;
                console.log('The "data to append" was appended to file!');
            });
        }
        return 0;
    } else {
        return 1;
    }

}

function removeJson(url) {

    const info = fs.readFileSync("./past_links.json");
    const infoJson = JSON.parse(info);
    const searchresults = infoJson.find((index) => index.link === url.toString());

    if (searchresults) {
        console.log('removing');
        infoJson.splice(searchresults, 1);
        fs.writeFile("./past_links.json", JSON.stringify(infoJson), function(err) {
            if (err) throw err;
            console.log('The "data to append" was appended to file!');
        });
    }


}


// new URL checker sends makes request to wesite

// IMPORTAINT NOTE!!! THESE DO NOT INLCUDE BROWSER HEARDERS AND HAVE NO PROXY!
// DO NOT USE TO VERIFY SENSATIVE LINKs!!
// URL VERIFICATION WILL BE DONE WHILE CHECKING LOGIN

async function urlCheck(url) { //DO NOT USE TO VERIFY SENSATIVE LINKS!!

    console.log(url);

    try {
        return await fetch(url).then((res) => res = res.ok);

    } catch (error) {
        console.log('fetch failed', error);

        return 0;
    }

}


// gets rid of all repeats ** KEEP **
// run this funciton to clean up your data base
// if will check to see if there are any repeats and delete them
// this function is not inlcuded in the code, but you can run this fuction
// when ever you feel is appropiate
function cleanUpData() {

    const info = fs.readFileSync("./past_links.json");
    const infoJson = JSON.parse(info);

    const arr1 = [...new Map(infoJson.map(item => [item['link'], item])).values()];

    const arr2 = [...new Map(arr1.map(item => [item['imageUrl'], item])).values()];


    console.log("Unique by place")
    console.log(JSON.stringify(arr2))

    fs.writeFile("./past_links.json", JSON.stringify(arr2), function(err) {
        if (err) throw err;
        console.log('The "data to append" was appended to file!');
    });

}


function saveToJson(url, imageUrlArray) {

    const info = { link: url.toString(), imageUrl: imageUrlArray.toString() };

    console.log(JSON.stringify(info));
    console.log("saved");

    if (urlCheck(url)) { // pervents from saving broken urls.. double check
        const data = fs.readFileSync('./past_links.json');
        const json = JSON.parse(data);
        //console.log(json);
        json.push(info);
        fs.writeFile("./past_links.json", JSON.stringify(json), function(err) {
            if (err) throw err;
            console.log('The "data to append" was appended to file!');
        });
    } else {
        console.log('Broken Url or fetch');
    }

}


function alertDev(message) {

    console.log('from channel: ' + message.channel.name + '\nfrom user: ' + message.author);

    // this is set up to send notifications to your phone throught IFTTT
    https.get('https://maker.ifttt.com/trigger/trigger/with/key/YOURKEYHERE', (res) => {
        // console.log('statusCode:', res.statusCode);
        // console.log('headers:', res.headers);

        res.on('data', (d) => {
            process.stdout.write(d);
        });

    }).on('error', (e) => {
        console.error(e);
    });


}





module.exports = { GetWeb, launchBrowserTest, launchProxieTest, checkURL, alertDev };

const textArrayDone = [
    'BOOM',
    'Here you go!',
    'Glad to help!',
    'There!',
    'Done!',
    'Check it',
    'Finished',
    'BAM!!',
    'BOP',
    'POW',
    'KUH-BLAMO',
    'Beep Boop',
    'Boop',
    'Theeere you go',
    'There you go!',
    'Thanks!',

];

const textArrayStart = [
    'Working on it!',
    'Coming right up',
    'One moment please',
    'Coming up!',
    'Let me search that for you',
    'Let me see what I can do',
    'Let me see what I can do for you',
    'easy peazy',
    'ez pz',
    'Let me see',
    'Sure thing!!',
    'No problemo!',
    'Gotcha',
    'No problemo!'

];


//https://en.wikipedia.org/wiki/Small