import { Event } from '../Typings/Event.js';
import { Mongo } from '../Integrations/Mongo';
// let cider_guild = '843954443845238864'; 
// let totalUsers: any;
// let activeUsers: any;

export const event: Event = {
	event: 'ready',
	async run(bot) {
		bot.logger.success(`We're now logged in to ${bot.user?.tag}!`);
		bot.logger.info(Date());

		Mongo.init();
		
		/* Requires Bot to be in cider_guild */
		// const guild = bot.guilds.cache.get(cider_guild);
		// Mongo.setActiveUsers(
		//   guild.roles.cache.get('932784788115427348').members.size
		// );
		// Mongo.setTotalUsers(
		//   guild.roles.cache.get('932816700305469510').members.size
		// );
		// Mongo.setActiveUsers(
		//   guild.roles.cache.get('932784788115427348').members.size
		// );
		// Mongo.setTotalUsers(
		//   guild.roles.cache.get('932816700305469510').members.size
		// );
		// Mongo.getActiveUsers().then((users: any) => {
		//   activeUsers = users;
		//   Mongo.getTotalUsers().then((users: any) => {
		//     totalUsers = users;
		//     bot.user.setActivity(
		//       `${activeUsers} / ${totalUsers} Active Cider Users`,
		//       { type: 'WATCHING' }
		//     );
		//     bot.logger.info(
		//       `Total Users: ${totalUsers} | Active Users: ${activeUsers}`
		//     );
		//   });
		// });
	},
};
