// AZLyrics fetcher api


var request = require("request");
var cheerio = require("cheerio");
var xml2js = require("xml2js");

var baseUrl = "http://www.azlyrics.com/lyrics/"

// Gets the lyrics for the song and artist provaided from AZLyrics.com
var getAZLyrics = function(artist, song, callback) {
	artist = artist.replace(/[\s-]/g, '').toLowerCase();
	song = song.replace(/[\s()-]/g, '').toLowerCase();
	url = baseUrl + artist + "/" + song.toLowerCase() + ".html"

	error = {code: 0, message: 0};

	console.log(artist, song, url);
	var lyric = { // default lyric data
		"found": false,
		"lyric": [""],
		"correctUrl": "http://www.azlyrics.com/add.php",
		"url": "http://www.azlyrics.com",
		"requestUrl": "http://requestlyrics.com",
		"provider": "AZ Lyrics",
		"html": true,
	};
	request(url, function (err, response, body) {
		if (!err && response.statusCode == 200) {
			azwebpage = cheerio.load(body);
			l = azwebpage(".ringtone").siblings().eq(7).html()
			lyric["found"] = true;
			lyric["lyric"] = l;
			lyric["url"] = response.url
		}
		else {
			error = {code: 2, message: err};

		}
		//console.log(error, lyric)
		callback(error, lyric)
	});

}

// Gets the lyrics for the song and artist provaided from chartlyrics.com
var getChartLyrics = function(artist, song, callback) {
	// console.log("lyrics");
	url = "http://api.chartlyrics.com/apiv1.asmx/SearchLyricDirect?artist="+ artist + "&song=" + song;
	error = { code: 0, message: ""};
	var lyric = { // default lyric data
		"found": false,
		"conflict": false,
		"lyric": [""],
		"correctUrl": "http://www.chartlyrics.com",
		"url": "http://www.chartlyrics.com",
		"requestUrl": "http://www.chartlyrics.com/app/contact.aspx?type=request&subject="+ song + "+%23by" + artist,
		"provider": "Chart Lyrics",
		"html": false
	};
	values = {
		artist: artist,
		song: song,
	};
	options = {
		//baseUrl: config.chartLyricsUrl,
		url: url,
		// qs: values
	};
	request(options, function (err, response, body) {
		if (!err && response.statusCode == 200) {
			xml2js.parseString(body, function (err, result) {
				if (result.GetLyricResult.LyricId > 0) {
					lyric["found"] = true
					if (result.GetLyricResult.LyricSong != song || result.GetLyricResult.LyricArtist != artist) {
						lyric["conflict"] = true
					}
				}
				else {
					lyric["found"] = false
				}
				//console.log(lyric)
				lyric["lyric"] = result.GetLyricResult.Lyric;
				lyric["url"] = result.GetLyricResult.LyricUrl;
				lyric["correctUrl"] = result.GetLyricResult.LyricCorrectUrl;
				//console.log(error, lyric);
				callback(error, lyric);
			});

		}
		else {
			error = {
				code: 4, // error loading lyrics
				message: err,
			};
		console.log(error, lyric)
		callback(error, lyric)
		}
	});
};

var get = function(artist, song, callback) {
	r = 0
	getChartLyrics(artist, song, function(error, lyrics){
		if (error.code == 0) {
			if (lyrics.found && !lyrics.conflict) {
				if (!r) {
					console.log("Chart")
					r = 1
					callback(error, lyrics)
				}
			}
		}
	});
	getAZLyrics(artist, song, function(error , lyrics){
		if (error.code == 0 && lyrics.found) {
			if (!r) {
					console.log("AZ")
					r = 1
					callback(error, lyrics)
				}
		}
	})
};

exports.get = get;
exports.getAZLyrics = getAZLyrics;
exports.getChartLyrics = getChartLyrics;