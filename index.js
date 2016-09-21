const Discord = require("discord.js");
const Twitter = require("twitter");
const winston = require("winston");
const _ = require("lodash")
const isTweet = _.conforms({
	id_str: _.isString,
	text: _.isString,
});

// log setup
const tsFormat = () => (new Date()).toLocaleTimeString();
const logger = new (winston.Logger)({
	transports: [
		// colorize the output to the console
		new (winston.transports.Console)({
			timestamp: tsFormat,
			colorize: true,
			level: "info"
		}),
		new (require("winston-daily-rotate-file"))({
			filename: "logFile.log",
			timestamp: tsFormat,
			datePattern: "yyyy-MM-dd",
			prepend: true,
			level: "info"
		})
	]
});

// screen name of twitter account to monitor
const FFXIV_TWITTER = "FF_XIV_EN";
const FFXIV_TWITTER_ID = "161223163";
// channel in discord to post new tweets to
const CHANNEL_NAME="final_fantasy_xiv";

// discord setup
const bot = new Discord.Client();
const token = process.env.DISCORD_BOT_SECRET;

// twitter setup
var twitterClient = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

bot.on("ready", () => {
	logger.info("Bot ready.");
	// init twitter listening
	twitterClient.stream("statuses/filter", {follow: FFXIV_TWITTER_ID}, function(stream) {
		stream.on("data", function(event) {
			if(isTweet(event)){
				logger.info("Twitter event from stream API.");
				var channel = bot.channels.find("name", CHANNEL_NAME)
				if(channel){
					channel.sendMessage(event.text);
				}
			}
		});
		stream.on("error", function(error) {
			logger.error(error);
		});
	});
});

// create an event listener for messages
bot.on("message", message => {
	if (message.content === "!xivtweet") {
		logger.info("Responding to message.");
		twitterClient.get("statuses/user_timeline.json?screen_name="+FFXIV_TWITTER+"&count=1", function(error, tweets, response) {
			if(error){
				logger.error(error);
				message.channel.sendMessage("Error when getting tweet :(");
				throw error;
			}
			var tweet = tweets[0];
			message.channel.sendMessage(tweet.text);
		});
	}
});

// bot login
bot.login(token);