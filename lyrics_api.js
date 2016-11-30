// AZLyrics fetcher api


var request = require("request");

var cheerio = require("cheerio");
var xml2js = require("xml2js");

var baseUrl = "http://www.azlyrics.com/lyrics/"

// Gets the lyrics for the song and artist provaided from AZLyrics.com
var getAZLyrics = function(artist, song, callback) {
	artist = artist.replace(/[\u00C0-\u017F\s\-()]/g, '').toLowerCase();
	song = song.replace(/[\u00C0-\u017F\s\-()]/g, '').toLowerCase();
	url = baseUrl + artist + "/" + song.toLowerCase() + ".html"

	error = {code: 0, message: 0};

	console.log(artist, song, url);
	var lyric = { // default lyric data
		"found": false,
		"lyric": [""],
		"correctUrl": "http://www.azlyrics.com/add.php",
		"url": url,
		"requestUrl": "http://requestlyrics.com",
		"provider": "AZ Lyrics",
		"html": true,
	};
	return new Promise(function (resolve, reject){
		request(url, function (err, response, body) {
			console.log(response.uri)
			if (!err && response.statusCode == 200) {
				azwebpage = cheerio.load(body);
				l = azwebpage(".ringtone").siblings().eq(7).html()
				lyric["found"] = true;
				lyric["lyric"] = l;
				resolve(lyric);
			}
			else if (response.statusCode == 404) {
				lyric["found"] = false;
				console.log("AZ", error, lyric)
				error = { code: 4, message: "Lyrics not found"}
				reject(error);
			}
			else {
				error = {code: 4, message: err};
				reject(error);
			}
		});
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
	return new Promise(function(resolve, reject){
		request(options, function (err, response, body) {
			if (!err && response.statusCode == 200) {
				xml2js.parseString(body, function (err, result) {
					lyric["lyric"] = result.GetLyricResult.Lyric;
					lyric["url"] = result.GetLyricResult.LyricUrl;
					lyric["correctUrl"] = result.GetLyricResult.LyricCorrectUrl;
					if (result.GetLyricResult.LyricId > 0) {
						lyric["found"] = true
						if (result.GetLyricResult.LyricSong != song || result.GetLyricResult.LyricArtist != artist) {
							lyric["conflict"] = true
						}
						console.log("Chart", error, lyric)
						resolve(lyric)
					}
					else {
						lyric["found"] = false;
						console.log("Chart", error, lyric)
						error = {
							code: 4, // error loading lyrics
							message: "Lyrics not found",
						};
						reject(error)
					}
					//console.log(lyric)
					//console.log(error, lyric);
				});

			}
			else {
				error = {
					code: 4, // error loading lyrics
					message: err,
				};
				//console.log(error, lyric)
				reject(error)
			}
		});
	});
};

var get = function(artist, song, callback) {
	tasks = [getAZLyrics(artist, song), getChartLyrics(artist, song)];

	error = {code: 0, message: ""};
	var lyric = { // default lyric data
		"found": false,
		"lyric": [""],
		"correctUrl": "http://www.azlyrics.com/add.php",
		"url": "http://www.azlyrics.com/",
		"requestUrl": "http://requestlyrics.com",
		"provider": "AZ Lyrics",
		"html": true,
	};

	Promise.race(tasks).then(function(l){
		console.log("Found", l);
		if (!l.conflict) {
			callback(error, l)
		}
		else {
			console("conflict")
			callback(error, l);
		}
	}, function(err){
		callback(err, lyric)
	});
	// , function(e) {
	//	console.log("Error", e);
	// 	callback(e, lyric)
	// });
};

exports.get = get;
exports.getAZLyrics = getAZLyrics;
exports.getChartLyrics = getChartLyrics;