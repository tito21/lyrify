//var http = require("http");
var request = require("request");
var express = require("express");
var path = require("path");
var xml2js = require("xml2js");
var qs = require("querystring");

var lyricsAPI = require("./lyrics_api.js");
var lastFm = require("./last_fm_api.js");

var user = { name : "" }

var track = {
	name: "",
	artist: { name: ""},
	album: {title: ""},
	url: "",
	img: "",
	lyric: {}
};

var app = express();

// Old functions
var getCurrentTrack = function(user, callback) {
	//url = config.lastfmUrl + "?method=user.getrecenttracks&limit=1&user=" + user.name + "&api_key=" + config.key + "&format=json"
	console.log("track");
	track = {};
	error = { code: 0, message: ""};
	values = {
		method: "user.getrecenttracks",
		user: user.name,
		api_key: config.key,
		format : "json"
	};
	options = {
		uri: config.lastfmUrl,
		qs: values,
		json: true
	}
	request(options, function (err, response, body) {
		if (!err && response.statusCode == 200) {
			if (!body.hasOwnProperty("error") && body.recenttracks.track.length > 0) {
				track = {
					artist : body.recenttracks.track[0].artist["#text"],
					album : body.recenttracks.track[0].album["#text"],
					name : body.recenttracks.track[0].name,
					url :body.recenttracks.track[0].url,
					img : body.recenttracks.track[0].image,
				};

				getLyrics(track, function(err, lyric) {
					track["lyric"] = lyric
					if (! (err.code == 0)){
						error = err;
					}
					getMoreInfo(track, function (err, trackInfo) {
						console.log("more info", trackInfo)
						if (trackInfo.artist.name) {
							track.artist = trackInfo.artist;
						}
						else {
							track.artist = { name: track.artist };
						}
						if (trackInfo.album.title) {
							track.album = trackInfo.album;
						}
						else {
							track.album = { title: track.album };
						}
						if (trackInfo.duration) {
							track.duration = trackInfo.duration;
						}
						else {
							track.duration = 0;
						}
						if (! (err.code)){
							error = err;
						}
						console.log(error, track)
						callback(error, track);
					});
				});
			}
			else {
				error = {
					code: 2,
					message : body.message,
				}
				console.log(error, track)
				callback(error, track);
			}	
		}
		else {
			error = {
				code: 1,
				message: err,
			};
			console.log(error, track)
			callback(error, track)
		}
	});
};

var getLyrics = function(track, callback) {
	console.log("lyrics");
	url = "http://api.chartlyrics.com/apiv1.asmx/SearchLyricDirect?artist="+ track.artist + "&song=" + track.name;
	error = { code: 0, message: ""};
	lyric = { // default lyric data
		found: false,
		conflict: false,
		lyric: [""],
		correctUrl: "http://www.chartlyrics.com",
		url: "http://www.chartlyrics.com",
		requestUrl: "http://www.chartlyrics.com/app/contact.aspx?type=request&subject="+ track.name + "+%23by"+track.artist,
		provider: "Chart Lyrics"
	};
	values = {
		artist: track.artist,
		song: track.name,
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
					if (result.GetLyricResult.LyricSong != track.name || result.GetLyricResult.LyricArtist != track.artist) {
						lyric["conflict"] = true
					}
				}
				else {
					lyric["found"] = false
				}
				console.log(lyric)
				lyric["lyric"] = result.GetLyricResult.Lyric;
				lyric["url"] = result.GetLyricResult.LyricUrl;
				lyric["correctUrl"] = result.GetLyricResult.LyricCorrectUrl;
				console.log(error, lyric);
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

var getArtistInfo = function (artist, callback) {
	// mbid = artist.mbid	;
	// url = config.lastfmUrl + "?method=artist.getinfo&mbid=" + mbid + "&api_key=" + config.key + "&format=json"
	console.log("artist")
	error = { code: 0, message: ""}
	values = {
		method: "artist.getinfo",
		mbid: artist.mbid,
		api_key: config.key,
		format : "json"
	};
	options = {
		uri: config.lastfmUrl,
		qs: values,
		json: true
	}
	request(options, function (err, response, body) {
		if (!err && response.statusCode == 200) {
			console.log(body);
			if ( !body.hasOwnProperty("error")) {
				console.log(error, body)
				callback(error, body)
			}
			else {
				error = {
					code: 2,
					message : body.message,
				}
				console.log(error, {})
				callback(error, {})	
			}
			
		}
		else {
			error = {
				code: 1,
				message: err,
			};
			console.log(error, {})
			callback(error, {})
		}
	});
};

var getMoreInfo = function (track, callback) {
	// url = config.lastfmUrl + "?method=track.getinfo&track=" + track.name + "&artist=" + track.artist + "&api_key=" + config.key + "&format=json"
	console.log("more info")
	error = { code: 0, message: ""}
	values = {
		method: "track.getinfo",
		track: track.name,
		artist: track.artist,
		api_key: config.key,
		format : "json"
	};
	options = {
		uri: config.lastfmUrl,
		qs: values,
		json: true
	}
	request(options, function (err, response, body) {
		if (!err && response.statusCode == 200) {
			if ( !body.hasOwnProperty("error")) {
				console.log(body);
				if (!body.track.artist) {
					body.track.artist = ""
				}
				if (!body.track.album) {
					body.track.album = ""
				}
				callback(error, body.track)
			}
			else {
				error = {
					code: 3,
					message : body.message,
				}
				console.log(error, track)
				callback(error, track)	
			}
			
		}
		else {
			error = {
				code: 1,
				message: err,
			};
			console.log(error, track)
			callback(error, track)
		}
	});
};

app.use(express.static(path.join(__dirname + "/public")));

app.get("/data", function(req, res) {
	user.name = req.query.user;
	lastFm.getCurrentTrack(user, track, function(error, t) {
		track = t;
		lyric = {}
		trackReady = 0;
		lyricsReady = 0;
		if (error.code == 0) {
			lastFm.getMoreInfo(t, function (error, tt){ 
				track = tt
				trackReady = 1;
				if (lyricsReady) {
					track["lyric"] = lyric;
					console.log(error, track);
					sent = {
						"track" : track,
						"user" : user,
						"error" : error,
					}
					console.log("sent\n", sent);
					res.send(sent);
				}
			});
			lyricsAPI.get(track.artist.name, track.name, function(error, l){
				lyric = l;
				lyricsReady = 1;
				console.log("lyric", lyric)
				if (trackReady) {
					track["lyric"] = lyric;
					console.log(error, track);
					sent = {
						"track" : track,
						"user" : user,
						"error" : error,
					}
					console.log("sent\n", sent);
					res.send(sent);
				}
			});
		}
		else {
			sent = {
				"track" : track,
				"user" : user,
				"error" : error,
			}
			console.log("sent\n", sent);
			res.send(sent);
		}
	});
});

app.post("/user", function(req, res){
	console.log("query:", req.query);
	user.name = req.query.user
	res.send({valid : true})
});

app.listen(8888, function () {
	console.log('Server running at localhost:8888');
});