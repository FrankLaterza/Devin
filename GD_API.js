//requiring path and fs modules
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
request = require('request');

// this code is modeled after googles examples

// If modifying these scopes, delete token.json.
const SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.photos.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';


// let googleGetInfo = [];
let FileGetInfo = [];
let googleGetInfo = [];
let missingId = [];
let deletedFileNames = [];

/// **** change this to your local file path! ****** ///

// put local folder path
const localFilePath = 'YOURFOLDERPATH';
// put id of foler
const GDfolderId = '"YOURFOLDERID"';

let publicClient = []

function startGDUpdate(client) {
    // //Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.

        // save the passed client 
        publicClient = client;

        //THIS RUNS MAIN THE PROCESS //
        authorize(JSON.parse(content), runAll);

        // **** UNCOMMENT THIS LINE TO GET TO LIST THE FOLDER IDS ****** //
        //authorize(JSON.parse(content), listFolderIds);


    });

}





/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    //getAccessToken(oAuth2Client, callback); // <- uncomment to get new TOken!

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client); //list files and upload file
        //callback(oAuth2Client, '0B79LZPgLDaqESF9HV2V3YzYySkE');//get file

    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}


function runAll(auth) {
    const drive = google.drive({ version: 'v3', auth });

    getListMemes(drive, '');


}



function getListMemes(drive, pageToken) {

    drive.files.list({
        corpora: 'user',
        pageSize: 10,
        q: GDfolderId + ' in parents',
        //q: "mimeType = 'application/vnd.google-apps.folder'", //get folder ids
        pageToken: pageToken ? pageToken : '',
        fields: 'nextPageToken, files(name, id, size)',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = res.data.files;
        if (files.length) {
            //console.log(files);
            processList(drive, files);

            if (res.data.nextPageToken) {
                getListMemes(drive, res.data.nextPageToken);
                //console.log(googleGetInfo);
            } else {

                readFilesMemes(localFilePath)
                mergeByProperty(FileGetInfo, googleGetInfo, 'name');
                getFile(drive);

            }
        } else {
            console.log('No files found.');
        }
    });

}

function processList(drive, files) {

    console.log('Processing....');
    files.forEach(file => {
        console.log(file.name + '|' + file.id + '|' + file.size);

        if (file.size * 0.000001 > 7.9) {

            deleteFile(drive, file);

            return 0;
        }
        googleGetInfo.push({ name: file.name, id: file.id });

        //console.log(file);
    });
}


// Deleting the image from Drive
function deleteFile(drive, file) {

    drive.files
        .delete({
            fileId: file.id,
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            if (res.status === 204) {
                console.log('deleted' + file.name);
                deletedFileNames.push(file.name);
            }
        });
}

function readFilesMemes(__dirname) {

    filenames = fs.readdirSync(__dirname);
    //listing all files using forEach
    console.log("\nCurrent directory filenames:");
    filenames.forEach(file => {
        FileGetInfo.push({ name: file })
    });

    console.log("done with files ")

}

function mergeByProperty(target, source, prop) {
    //merg results into one array



    source.forEach(sourceElement => {
        let targetElement = target.find(targetElement => {
            return sourceElement[prop] === targetElement[prop];
        })
        targetElement ? {...sourceElement } : target.push(sourceElement);
    })

    //filter by id

    missingId = target.filter(function(target) {
        return target.id;
    })


    if (missingId.length === 0) {

        console.log('Media Folder Update: No new files found')
        const guildList = publicClient.guilds.cache
        guildList.forEach((guild) => {
            const channel = guild.channels.cache.find((channel) => channel.type === 'text') // try to find the channel
            if (!channel) return; // if it couldn't find a text channel, skip this guild
            const channel1 = guild.channels.cache.find(channel1 => channel1.name === 'bot-logs');
            if (!channel1) return;
            channel1.send('Media Folder Update: No new files found. Folder up to date!');
        });
    } else {
        console.log('Media Folder Update: ' + missingId.length + ' new addedfiles found!')

        const guildList = publicClient.guilds.cache
        guildList.forEach((guild) => {
            const channel = guild.channels.cache.find((channel) => channel.type === 'text') // try to find the channel
            if (!channel) return; // if it couldn't find a text channel, skip this guild
            const channel1 = guild.channels.cache.find(channel1 => channel1.name === 'bot-logs');
            if (!channel1) return;
            channel1.send('Media Folder Update: ' + missingId.length + ' new files found!');
            if (deletedFileNames.length > 1) {
                channel1.send('Media Folder Update: ' + deletedFileNames.length + ' files have been removed from dirve. Reason: too big');
            }
        });
    }

    console.log(missingId); // <-- bringo. we need to get these

}




function getFile(drive) {


    missingId.forEach(function(element) {

        const fileIdl = element.id;
        drive.files
            .get({ fileId: fileIdl, alt: 'media', mimeType: 'image/png' }, { responseType: 'stream' })
            .then(res => {
                return new Promise((resolve, reject) => {

                    const filePath = (localFilePath + '/' + element.name);
                    console.log(`writing to ${filePath}`);
                    const dest = fs.createWriteStream(filePath);
                    let progress = 0;

                    res.data
                        .on('end', () => {
                            console.log('Done downloading file.');
                            resolve(filePath);
                        })
                        .on('error', err => {
                            console.error('Error downloading file.');
                            reject(err);
                        })
                        .on('data', d => {
                            progress += d.length;
                            if (process.stdout.isTTY) {
                                process.stdout.clearLine();
                                process.stdout.cursorTo(0);
                                process.stdout.write(`Downloaded ${progress} bytes`);
                            }
                        })
                        .pipe(dest);
                });
            });
    });

    console.log('all files up to date!!!')


}



//client.channels.cache.get(`channelID`).send(`Text`)


module.exports = { startGDUpdate };