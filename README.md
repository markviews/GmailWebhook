# GmailWebhook
Sends new emails to a discord webhook using Gmail API

### Setup
1. Install [Node.js](https://nodejs.org/en/download/) and packages `npm i fs readline googleapis js-base64 axios`
2. Create a discord webhook and paste it on lines 118 and 141 of the script
3. [Create Credentials](https://developers.google.com/workspace/guides/create-credentials#desktop) follow steps to Create Desktop application credentials and get `credentials.json`
4. Run the server `node email.js`

### Notes
* You can change the refresh rate at the bottom of the script (line 158). It's set to 60 seconds.
* Email body is trimmed to 1800 characters to meet discord's character limit
* Email attachments are ignored
* You can include the actual email address the message was sent from by deleting line 99
* You can change the name and profile picture of your webhook in discord settings
* My code is based off [Google's example](https://developers.google.com/gmail/api/quickstart/nodejs)
* [Discord webhook format](https://discord.com/developers/docs/resources/webhook#edit-webhook-message-jsonform-params)
* [Discord webhook color codes](https://gist.github.com/thomasbnt/b6f455e2c7d743b796917fa3c205f812)

![](https://i.ibb.co/kqtxhBC/unknown.png)
