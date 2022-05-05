const isRailway = require('is-railway');
import * as token from '../JSON/Tokens.json';
import * as atmos from '../Replies/atmos.json';
import * as greyadout from '../Replies/greyedout.json';
import * as lossless from '../Replies/lossless.json';
import * as lyrics from '../Replies/lyrics.json';
import * as slow from '../Replies/slow.json';
module.exports = {
	token: function () {
		if (isRailway()) {
			return process.env.TOKEN;
		} else {
			return token;
		}
	},
	mongo: function () {
		if (isRailway()) {
			return `mongodb://${process.env.MONGOUSER}:${process.env.MONGOPASSWORD}@${process.env.MONGOHOST}:${process.env.MONGOPORT}`;
		} else {
			return token.mongo;
		}
	},
	port: function () {
		if (isRailway()) {
			return process.env.PORT;
		} else {
			return token.port;
		}
	},
	expressurl: function () {
		if (isRailway()) {
			return process.env.URL;
		} else {
			return `${token.url}:${token.port}`;
		}
	},
	auth: {
		clientId: function () {
			if (isRailway()) {
				return process.env.AUTH_CLIENTID;
			} else {
				return token.auth.clientId;
			}
		},
		clientSecret: function () {
			if (isRailway()) {
				return process.env.AUTH_CLIENTSECRET;
			} else {
				return token.auth.clientSecret;
			}
		},
	},
	ocKey: function () {
		if (isRailway()) {
			return process.env.ocKey;
		} else {
			return token.ocKey;
		}
	},
	emptyFunction: function () {
		return `${token.auth}${atmos}${greyadout}${lossless}${lyrics}${slow}`; // This function is just present to force typescript to compile json file. Ignore this function.
	},
};
