const say = require("say");
const Twitter = require("twitter");

let client = new Twitter({
  consumer_key: "",
  consumer_secret: "",
  access_token_key: "",
  access_token_secret: ""
});

let voices = [
  "Alex",
  "Ava",
  "Daniel",
  "Fiona",
  "Karen",
  "Moira",
  "Samantha",
  "Tessa",
  "Tom",
  "Veena",
  "Victoria"
];

function voice() {
  return voices[Math.floor(Math.random() * voices.length)];
}

function sayTweets() {
  client.get(
    "statuses/home_timeline",
    { tweet_mode: "extended" },
    (error, tweets) => {
      if (!error) {
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
              .replace("#", "Hashtag ")
          }));

        let to_say = tweets
          .map(t => ({ ...t, date: t.date - (Date.now() - 60000) }))
          .filter(t => t.date > 0);

        console.log(to_say);

        to_say.forEach(t => {
          setTimeout(() => {
            say.speak(t.tweet, voice());
          }, t.date);
        });
      } else {
        console.log(error);
      }
    }
  );
}

setInterval(sayTweets, 60000);
sayTweets();
