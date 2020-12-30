const express = require("express");
var Twitter = require("node-twitter-api");
const accountSid = "";
const authToken = "";
const client = require("twilio")(accountSid, authToken);

const app = express();
const port = 5000;

app.use(express.urlencoded());
app.use(express.json());

var twitter = new Twitter({
  consumerKey: "",
  consumerSecret: "",
  callback: "http://url/oauth-callback"
});

var _requestSecret;

app.get("/", (req, res) =>
  res.send(`<html>
  <head>
  <title>Never miss a tweet</title>
  </head>
  <body>
  <h2>automatically get a phone call every time there's new tweet to read</h2>
  <h3><a href="/request-token">just log in with Twitter</a></h3>
  <h4>never miss one</h4>
  </body>
  </html>`)
);

app.get("/request-token", function(req, res) {
  twitter.getRequestToken(function(err, requestToken, requestSecret) {
    if (err) res.status(500).send(err);
    else {
      _requestSecret = requestSecret;
      res.redirect(
        "https://api.twitter.com/oauth/authenticate?oauth_token=" + requestToken
      );
    }
  });
});

app.get("/oauth-callback", function(req, res) {
  var requestToken = req.query.oauth_token,
    verifier = req.query.oauth_verifier;

  twitter.getAccessToken(requestToken, _requestSecret, verifier, function(
    err,
    accessToken,
    accessSecret
  ) {
    if (err) res.status(500).send(err);
    else
      twitter.verifyCredentials(accessToken, accessSecret, function(err, user) {
        if (err) {
          res.status(500).send(err);
        } else {
          console.log(user.screen_name);
          res.send(`
            Thank you. Please enter your phone number to subscribe.
            <form action="/subscribe" method="post">
            <input type="text" name="phoneNumber">
            <input type="hidden" name="accessToken" value="${accessToken}">
            <input type="hidden" name="accessSecret" value="${accessSecret}">
            <input type="submit" value="Submit">
            </form>
          `);
        }
      });
  });
});

app.post("/subscribe", (req, res) => {
  const accessSecret = req.body.accessSecret;
  const accessToken = req.body.accessToken;
  const phoneNumber = req.body.phoneNumber;
  console.log(phoneNumber);

  sayTweets(accessToken, accessSecret, phoneNumber);
  setInterval(() => {
    sayTweets(accessToken, accessSecret, phoneNumber);
  }, 60 * 1000);

  res.send(`"Congratulations."`);
});

app.post("/tweet", function(req, res) {
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say voice="${voice()}">${req.query.tweet}</Say>
    </Response>`);
});

app.listen(port, () => console.log(`listening on port ${port}!`));

let voices = [
  "Polly.Ivy",
  "Polly.Joanna",
  "Polly.Joey",
  "Polly.Justin",
  "Polly.Kendra",
  "Polly.Kimberly",
  "Polly.Matthew",
  "Polly.Salli",
  "Polly.Raveena",
  "Polly.Amy",
  "Polly.Brian",
  "Polly.Emma",
  "Polly.Nicole",
  "Polly.Russell",
  "alice",
  "man",
  "woman"
];

function voice() {
  return voices[Math.floor(Math.random() * voices.length)];
}

function sayTweets(accessToken, accessSecret, phoneNumber) {
  twitter.getTimeline(
    "home_timeline",
    { tweet_mode: "extended" },
    accessToken,
    accessSecret,
    (err, tweets) => {
      if (err) console.log(err);
      tweets = tweets
        .map(t => ({
          date: t.created_at,
          tweet:
            (t.quoted_status ? t.quoted_status.full_text + " " : "") +
            (t.retweeted_status ? t.retweeted_status.full_text : t.full_text)
        }))
        .map(t => ({
          date: new Date(t.date),
          tweet: t.tweet
            .replace(/(?:https?|ftp):\/\/[\n\S]+/g, "")
            .replace(/#/g, "Hashtag ")
            .replace(/@/g, "At ")
            .replace(/&amp;/g, " and ")
        }));

      let to_say = tweets
        .map(t => ({ ...t, date: t.date - (Date.now() - 60000) }))
        .filter(t => t.date > 0);

      console.log(to_say);

      to_say.forEach(t => {
        setTimeout(() => {
          client.calls.create({
            url:
              "http://url/tweet?tweet=" +
              encodeURIComponent(t.tweet),
            to: phoneNumber,
            from: ""
          });
        }, t.date);
      });
    }
  );
}
