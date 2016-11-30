
var xml2js = require("xml2js");
var request = require("request");
var config = require("./config.json");

//Returns the track object updated with the currets user song
var getCurrentTrack = function(user, track, callback) {
	//url = config.lastfmUrl + "?method=user.getrecenttracks&limit=1&user=" + user.name + "&api_key=" + config.key + "&format=json"
	console.log("track");
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
				track["artist"] = { name: body.recenttracks.track[0].artist["#text"] };
				track["album"] = { title: body.recenttracks.track[0].album["#text"] };
				track["name"] = body.recenttracks.track[0].name;
				track["url"] = body.recenttracks.track[0].url;
				track["img"] = body.recenttracks.track[0].image;
			}
			else {
				error = {
					code: 2, // Error on getting the user's current song
					message : body.message,
				}
			}
		}
		else {
			error = { // Network error
				code: 1,
				message: err,
			};
		}

		console.log(error, track)
		callback(error, track);

	});
};

// adds extra artist and album info to the track
var getMoreInfo = function (track, callback) {
	url = config.lastfmUrl + "?method=track.getinfo&track=" + track.name + "&artist=" + track.artist.name + "&api_key=" + config.key + "&format=json"
	console.log("more info", url)
	error = { code: 0, message: ""}
	values = {
		method: "track.getinfo",
		track: track.name,
		artist: track.artist.name,
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
				if (body.track.artist) {
					track["artist"] = body.track.artist;
				}
				if (body.track.album) {
					track["album"] = body.track.album;
				}
			}
			else {
				error = {
					code: 3, // Error getting extra info
					message : body.message,
				}
			}
			
		}
		else {
			error = {
				code: 1,
				message: err,
			};
		}

		console.log(error, track);
		callback(error, track);
	});
};
// returns an artist object with more information
var getArtistInfo = function (artist, callback) {
	// mbid = artist.mbid;
	// url = config.lastfmUrl + "?method=artist.getinfo&mbid=" + mbid + "&api_key=" + config.key + "&format=json"
	console.log("artist")
	error = { code: 0, message: ""}
	values = {
		method: "artist.getinfo",
		mbid: artist.mbid,
		artist: artist.name,
		api_key: config.key,
		format : "json"
	};
	options = {
		uri: config.lastfmUrl,
		qs: values,
		json: true
	};
	request(options, function (err, response, body) {
		if (!err && response.statusCode == 200) {
			console.log(body);
			if ( !body.hasOwnProperty("error")) {
				artist = body;
			}
			else {
				error = {
					code: 5, // Error geiting artist info
					message : body.message,
				}
			}
			
		}
		else {
			error = {
				code: 1,
				message: err,
			};
		}
	console.log(error, artist);
	callback(error, artist)	
	});
};

exports.getCurrentTrack = getCurrentTrack;
exports.getMoreInfo = getMoreInfo;
exports.getArtistInfo = getArtistInfo;