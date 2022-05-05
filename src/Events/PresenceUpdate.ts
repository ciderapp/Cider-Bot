import { Event } from '../Typings/Event.js';
import { Mongo } from '../Integrations/Mongo';
let cider_guild = '843954443845238864';
let totalUsers: any;
let activeUsers: any;

export const event: Event = {
	event: 'presenceUpdate',
	async run(bot, oldMember, newMember) {
		try {
			if (
				oldMember.guild.id !== cider_guild ||
				newMember.guild.id !== cider_guild
			)
				return;
		} catch (e) {
			return;
		}

		const role = newMember.guild.roles.cache.get('932784788115427348');

		let using_cider = false;
		for (const activity of newMember.activities) {
			/*
            911790844204437504 - Cider
            886578863147192350 - Apple Music
        */
			if (
				activity &&
				(activity.applicationId === '911790844204437504' ||
					activity.applicationId === '886578863147192350')
			) {
				let ListenerInfo = {
					userid: newMember.userId,
					userName: newMember.member.user.username,
					songName: activity.details,
					artistName: String(activity.state).split('by ')[1],
				};
				Mongo.logRPMetadata(ListenerInfo);

				if (newMember.member._roles.includes('932784788115427348')) {
					bot.logger.info('\x1b[2m', 'Listener updated -', ListenerInfo);
					return;
				} else {
					bot.logger.info(
						'\x1b[35m%s\x1b[0m',
						'Listener added -',
						ListenerInfo
					);
					try {
						Mongo.incrementActiveUsers().then(() => {
							Mongo.getActiveUsers().then((users: any) => {
								activeUsers = users;
								bot.user.setActivity(
									`${activeUsers} / ${totalUsers} Active Cider Users`,
									{ type: 'WATCHING' }
								);
							});
						});
					} catch (e) {
						bot.logger.error('An error occurred. ', e);
					}
					using_cider = true;
					break;
				}
			}
		}
		if (using_cider) {
			try {
				newMember.member.roles.add(role);
				if (!newMember.member._roles.includes('932816700305469510')) {
					try {
						newMember.member.roles.add('932816700305469510');
						Mongo.incrementTotalUsers().then(() => {
							Mongo.getTotalUsers().then((users: any) => {
								totalUsers = users;
								bot.user.setActivity(
									`${activeUsers} / ${totalUsers} Active Cider Users`,
									{ type: 'WATCHING' }
								);
							});
						});
					} catch (e) {
						bot.logger.error('An error occurred while adding role. ', e);
					}
				}
			} catch (e) {
				bot.logger.error('An error occurred. ', e);
			}
		} else {
			try {
				if (newMember.member._roles.includes('932784788115427348')) {
					try {
						newMember.member.roles.remove('932784788115427348');
					} catch (e) {
						bot.logger.error('An error occurred on role removal. ', e);
					}
					let RMListenerInfo = {
						userid: newMember.userId,
						userName: newMember.member.user.username,
						dateRemoved: Date(),
					};
					bot.logger.info(
						'\x1b[33m%s\x1b[0m',
						'Listener removed -',
						RMListenerInfo
					);
					try {
						Mongo.decrementActiveUsers().then(() => {
							Mongo.getActiveUsers().then((users: any) => {
								activeUsers = users;
								bot.user.setActivity(
									`${activeUsers} / ${totalUsers} Active Cider Users`,
									{ type: 'WATCHING' }
								);
							});
						});
					} catch (e) {
						bot.logger.error('An error occurred. ', e);
					}
				}
			} catch (e) {
				bot.logger.error(e);
			}
		}
	},
};
