
import isRailway from 'is-railway';
import environment from './tokens.json' assert { type: 'json'};

export const token = isRailway() ? process.env.TOKEN : environment.token;
export const mongo = isRailway() ? `mongodb://${process.env.MONGOUSER}:${process.env.MONGOPASSWORD}@${process.env.MONGOHOST}:${process.env.MONGOPORT}` : environment.mongo;
export const port = isRailway() ? process.env.PORT : environment.port;
export const expressurl = isRailway() ? process.env.URL : `${environment.url}:${environment.port}`;
export const clientId = isRailway() ? process.env.AUTH_CLIENTID : environment.auth.clientId;
export const clientSecret = isRailway() ? process.env.AUTH_CLIENTSECRET : environment.auth.clientSecret;
export const errorChannel = isRailway() ? process.env.errorChannel : environment.channelIds.error;
export const starboardChannel = isRailway() ? process.env.starboardChannel : environment.channelIds.starboard;
export const guildId = isRailway() ? process.env.guildId : environment.guildId;
export const ocKey = isRailway() ? process.env.ocKey : environment.ocKey;
export const ghKey = isRailway() ? process.env.ghKey : environment.ghKey;