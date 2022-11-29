const google = require('googleapis');
const googleServiceAccountKey = require('./lumine2359-65d3edb4c88d.json');

const googleJWTClient = new google.Auth.JWT(
  googleServiceAccountKey.client_email,
  null,
  googleServiceAccountKey.private_key,
  ['https://www.googleapis.com/auth/cloud-platform'],
  null
);

googleJWTClient.authorize((error, access_token) => {
  if (error) {
    return console.error("Couldn't get access token", e);
  }
  console.log(access_token);
});
