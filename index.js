const _ = require("lodash");
const Discord = require("discord.js");
const winston = require("winston");
const request = require('request');

// channel in discord to post new lodestone topics to
const CHANNEL_NAME="final_fantasy_xiv";
// discord stoken
const token = process.env.DISCORD_BOT_SECRET;
// how often to poll lodestone API
const CHECK_INTERVAL = 5 * 60 * 1000;

var previousTopicTimestamp = null;

// lodestone api/data functions
var getLodestoneData = function(callback){
	request("http://xivdb.com/assets/lodestone.json", function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var json;
			try{
				json = JSON.parse(body);
			}catch(e){
				// fallback
				var startPos = body.indexOf('({');
				var endPos = body.indexOf('})');
				var jsonStr = body.substring(startPos+1, endPos+1);
				json = JSON.parse(jsonStr);
			}
			callback(json);
		}else{
			log.error("Error accessing xivdb API : " + error);
		}
	});
};

var printLodestoneTopic = function(channel, topic){
	log.info("Posting message to channel "+channel.id);
	channel.sendMessage(topic.title);
	channel.sendMessage(topic.url);
	channel.sendMessage(topic.banner);
};

// log setup
const tsFormat = () => (new Date()).toLocaleTimeString();
const log = new (winston.Logger)({
	transports: [
		// colorize the output to the console
		new (winston.transports.Console)({
			timestamp: tsFormat,
			colorize: true,
			level: "info"
		}),
		new (require("winston-daily-rotate-file"))({
			filename: "-ffxiv-news.log",
			timestamp: tsFormat,
			datePattern: "yyyy-MM-dd",
			prepend: true,
			level: "info"
		})
	]
});

const bot = new Discord.Client();

bot.on("ready", () => {
	log.info("Bot ready.");
	setInterval(function(){
		log.info("Checking lodestone.");
		getLodestoneData(function(data){
			if(data && data.hasOwnProperty("topics") && data.topics.length > 0){
				var mostRecentTopic = data.topics[0];
				// if the most recent is newer than what we've seen, post it
				if(previousTopicTimestamp != null 
					&& mostRecentTopic.timestamp > previousTopicTimestamp){ 
					_.each(bot.channels.findAll("name", CHANNEL_NAME), function(channel){
						printLodestoneTopic(channel, mostRecentTopic);
					});
				}
				previousTopicTimestamp = mostRecentTopic.timestamp;
			}
		});
	}, CHECK_INTERVAL);
});

// create an event listener for messages
bot.on("message", message => {
	if (message.content === "!xivnews") {
		log.info("Responding to message.");
		getLodestoneData(function(data){
			printLodestoneTopic(message.channel, data.topics[0]);
		});
	}
});

// bot login
bot.login(token);