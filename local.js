const isRailway = require('is-railway');
const config = require('./tokens.json');

module.exports = {
    token: function () {
        if (isRailway()) {
            return process.env.TOKEN;
        } else {
            return config.token;
        }
    },
    mongo: function () {
        if (isRailway()) {
            return `mongodb://${process.env.MONGOUSER}:${ process.env.MONGOPASSWORD }@${ process.env.MONGOHOST }:${ process.env.MONGOPORT }`;
        } else {
            return config.mongo;
        }
    },
    port: function () {
        if (isRailway()) {
            return process.env.PORT;
        } else {
            return config.port;
        }
    },
    expressurl: function () {
        if (isRailway()) {
            return process.env.URL;
        } else {
            return `${config.url}:${config.port}`;
        }
    },
    auth: {
        clientId: function () {
            if (isRailway()) {
                return process.env.AUTH_CLIENTID;
            } else {
                return config.auth.clientId;
            }
        },
        clientSecret: function () {
            if (isRailway()) {
                return process.env.AUTH_CLIENTSECRET;
            } else {
                return config.auth.clientSecret;
            }
        },
    }
}