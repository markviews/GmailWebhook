const fs = require('fs')
const readline = require('readline')
const {google} = require('googleapis')
const base64 = require('js-base64')
const axios = require('axios')

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = 'token.json';
var gmail;

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content), unread);
});

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({access_type: 'offline',scope: SCOPES,});
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

//check for unread messages
function unread(auth) {

  if (auth != null) {
    gmail = google.gmail({version: 'v1', auth});
    loop(); //start loop funciton first on first run
    console.log("Listening for emails.. ");
  }

  gmail.users.threads.list({userId: 'me', "q":"is:unread",}, (err, res) => {
    if (err) return webhookError('The API returned an error:', err);

    if (res.data.resultSizeEstimate > 0) {
      res.data.threads.forEach(element => {
        read(element.id);
      });
    }

  });
}

//read a message by ID
function read(threadId) {
  gmail.users.threads.get({userId: 'me', "id":threadId,}, (err, res) => {
    if (err) return webhookError('The API returned an error:', err);

    //mark the email as read
    gmail.users.threads.modify({userId: 'me', "id":threadId, "removeLabelIds":["UNREAD"]});

    console.log("---");

    var from = "";
    var date = "";
    var subject = "";
    var body = base64.decode(res.data.messages[0].payload.parts[0].body.data.replace(/-/g, '+').replace(/_/g, '/')).trim();

    res.data.messages[0].payload.headers.forEach(element => {
      if (element.name == "From") from = element.value
      if (element.name == "Date") date = element.value
      if (element.name == "Subject") subject = element.value
    });

    //remove timezone and seconds from date string
    if (date != "") {
      const args = date.split(' ');
      date = date.substring(0, date.length - args[args.length - 1].length - 4);
    }

    //remove email from `from` string
    if (from != "") {
      const args = from.split(' ');
      from = from.substring(0, from.length - args[args.length - 1].length - 1);
    }

    //trim messages to not go over discord's message limit
    from = from.substring(0,50);
    subject = subject.substring(0,100);
    body = body.substring(0,1800);

    console.log("From: " + from);
    console.log("Date: " + date);
    console.log("Subject: " + subject);
    console.log("Body: " + body)

    webhook(from, date, subject, body);
  });
}

//send message to webhook
function webhook(from, date, subject, body) {
  axios.post('https://discord.com/api/webhooks/WEBHOOK_LINK_HERE', {
                embeds: [
                  {
                    author: {
                      name: from
                    },
                    title: subject,
                    description: body,
                    color: "16776960",
                    footer: {
                      text: date
                    }
                  }
                ]
              }).then(res => {
                if (res.status >= 200 && res.status <= 299) console.log("Successfully sent to discord!")
                else console.log(`Failed to send.. status code: ${res.status}`)
              }).catch(error => console.error(error))
}

//send error message to webhook
function webhookError(title, error) {
  console.log(error);
  axios.post('https://discord.com/api/webhooks/WEBHOOK_LINK_HERE', {
                embeds: [
                  {
                    author: {
                      name: title
                    },
                    description: error,
                    color: "15158332"
                  }
                ]
              }).then(res => {
                if (res.status >= 200 && res.status <= 299) console.log("Successfully sent to discord!")
                else console.log(`Failed to send.. status code: ${res.status}`)
              }).catch(error => console.error(error))
}

//check for new mail every 60 seconds
function loop() { unread(null); setTimeout(loop, 60000)}
