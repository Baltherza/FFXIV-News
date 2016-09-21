const Discord = require("discord.js");
const winston = require("winston");
var request = require('request');

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
			logger.error("Error accessing xivdb API : " + error);
		}
	});
};

var printLodestoneTopic = function(channel, topic){
	channel.sendMessage(topic.title);
	channel.sendMessage(topic.url);
	channel.sendMessage(topic.banner);
};

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
			filename: "-ffxiv-tweet.log",
			timestamp: tsFormat,
			datePattern: "yyyy-MM-dd",
			prepend: true,
			level: "info"
		})
	]
});

// channel in discord to post new tweets to
const CHANNEL_NAME="final_fantasy_xiv";

// discord setup
const bot = new Discord.Client();
const token = process.env.DISCORD_BOT_SECRET;

bot.on("ready", () => {
	logger.info("Bot ready.");
});

// create an event listener for messages
bot.on("message", message => {
	if (message.content === "!xivnews") {
		logger.info("Responding to message.");
		getLodestoneData(function(data){
			printLodestoneTopic(message.channel, data.topics[0]);
		});
	}
});

// bot login
bot.login(token);