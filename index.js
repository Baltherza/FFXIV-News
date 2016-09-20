const Discord = require("discord.js");
const Twitter = require("twitter");


// discord setup
const bot = new Discord.Client();
const token = process.env.DISCORD_BOT_SECRET;

// twitter setup
var twitterClient = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	bearer_token: process.env.TWITTER_BEARER_TOKEN
});

bot.on("ready", () => {
	console.log("Bot ready.");
});

// create an event listener for messages
bot.on("message", message => {
	if (message.content === "!xivtweet") {
		twitterClient.get("statuses/user_timeline.json?screen_name=FF_XIV_EN&count=1", function(error, tweets, response) {
			if(error){
				console.log(error);
				message.channel.sendMessage("Error when getting tweet :(");
				throw error;
			}
			var tweet = tweets[0];
			console.log(tweet);
			message.channel.sendMessage(tweet.text);
		});
	}
});

// bot login
bot.login(token);