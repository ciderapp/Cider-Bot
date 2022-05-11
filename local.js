const isRailway = require('is-railway');
//require('./tokens.json')
// a
module.exports = {
    token: function () {
        if (isRailway()) {
            return process.env.TOKEN;
        } else {
            return require('./tokens.json').token;
        }
    },
    mongo: function () {
        if (isRailway()) {
            return `mongodb://${process.env.MONGOUSER}:${ process.env.MONGOPASSWORD }@${ process.env.MONGOHOST }:${ process.env.MONGOPORT }`;
        } else {
            return require('./tokens.json').mongo;
        }
    },
    port: function () {
        if (isRailway()) {
            return process.env.PORT;
        } else {
            return require('./tokens.json').port;
        }
    },
    expressurl: function () {
        if (isRailway()) {
            return process.env.URL;
        } else {
            return `${require('./tokens.json').url}:${require('./tokens.json').port}`;
        }
    },
    auth: {
        clientId: function () {
            if (isRailway()) {
                return process.env.AUTH_CLIENTID;
            } else {
                return require('./tokens.json').auth.clientId;
            }
        },
        clientSecret: function () {
            if (isRailway()) {
                return process.env.AUTH_CLIENTSECRET;
            } else {
                return require('./tokens.json').auth.clientSecret;
            }
        },
    },
    ocKey: function () {
        if (isRailway()){
            return process.env.ocKey
        } else {
            return require('./tokens.json').ocKey;
        }
    },
    ghKey: function () {
        if (isRailway()){
            return process.env.ghKey
        } else {
            return require('./tokens.json').ghKey;
        }
    }
}