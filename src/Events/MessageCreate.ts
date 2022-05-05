import { Event } from '../Typings/Event.js';
const fs = require('node:fs');
const consola = require('consola');
import { Mongo } from '../Integrations/Mongo';
let replies: Array<any> = [];
let reply: any;
const path = require('path');
const dirPath = path.resolve(__dirname, '../Replies/');

const replyFiles = fs
	.readdirSync(dirPath)
	.filter((file: string) => file.endsWith('.json'));
for (const file of replyFiles) {
	reply = require(`../replies/${file}`);
	replies.push(reply);
	consola.info('\x1b[32m%s\x1b[0m', 'Registered Reply: ', reply.name);
}
const overrideRegex = new RegExp(/^\!/g);
import { MessageEmbed, MessageButton, MessageActionRow } from 'discord.js';
const cheerio = require('cheerio');

export const event: Event = {
	event: 'messageCreate',
	async run(bot, message) {
		if (
			message.author.bot ||
			!message.guild ||
			!message.member ||
			message.channel.type === 'DM'
		)
			return;
		if (
			(!message.member._roles.includes('848363050205446165') &&
				!message.member._roles.includes('932811694751768656') &&
				!message.member.id.includes('345021804210814976')) ||
			overrideRegex.test(message.toString())
		) {
			for (reply of replies) {
				var regex = new RegExp(`\\b${reply.name}\\b`, 'gi');
				if (regex.test(message.toString())) {
					bot.logger.info('\x1b[32m%s\x1b[0m', 'Reply triggered:', reply.name);
					Mongo.replyCounter(reply.name);
					message.react('✅');
					const embed = new MessageEmbed()
						.setColor(bot.config.color)
						.setTitle(`${reply.title}`)
						.setDescription(`${reply.description}`)
						.setFooter({
							text: 'Requested by ' + message.member.user.username,
							iconURL: message.member.user.avatarURL(),
						})
						.setTimestamp();
					message
						.reply({ embeds: [embed] })
						.then((msg: { delete: () => void }) => {
							setTimeout(() => msg.delete(), reply.timeout);
						});
				}
				if (reply.aliases) {
					for (var i = 0; i < reply.aliases.length; i++) {
						var regex = new RegExp(`\\b${reply.aliases[i]}\\b`, 'gi');
						if (regex.test(message.toString())) {
							bot.logger.info(
								'\x1b[32m%s\x1b[0m',
								'Reply triggered:',
								reply.name
							);
							Mongo.replyCounter(reply.name);
							message.react('✅');
							const embed = new MessageEmbed()
								.setColor(bot.config.color)
								.setTitle(`${reply.title}`)
								.setDescription(`${reply.description}`)
								.setFooter({
									text: 'Requested by ' + message.member.user.username,
									iconURL: message.member.user.avatarURL(),
								})
								.setTimestamp();
							message
								.reply({ embeds: [embed] })
								.then((msg: { delete: () => void }) => {
									setTimeout(() => msg.delete(), reply.timeout);
								});
						}
					}
				}
			}
		} else if (
			message.content.match(/^(?!cider:\/\/).+(music\.apple\.com)([^\s]+)/gi)
		) {
			const link = message.content.match(
				/^(?!cider:\/\/).+(music\.apple\.com)([^\s]+)/gi
			);
			bot.logger.info('[Link] Creating redirect embed.');
			try {
				fetch(link)
					.catch(() =>
						bot.logger.error('[Link] Error creating redirect embed.')
					)
					.then(result => (result as any).text())
					.catch(() => null)
					.then(html => {
						const $ = cheerio.load(html);
						const title =
							$('meta[property="og:title"]').attr('content') ||
							$('title').text() ||
							$('meta[name="title"]').attr('content');
						const description =
							$('meta[property="twitter:description"]').attr('content') ||
							$('meta[name="twitter:description"]').attr('content');
						const image =
							$('meta[property="og:image"]').attr('content') ||
							$('meta[property="og:image:url"]').attr('content');
						const ModLink = link[0].replace('https://', '');
						const play_link = 'https://cider.sh/p?' + ModLink;
						const view_link = 'https://cider.sh/o?' + ModLink;
						const embed = new MessageEmbed()
							.setColor(bot.config.color)
							.setTitle(title)
							.setURL(link.toString())
							.setThumbnail(image)
							.setDescription(description)
							.setFooter({
								text: 'Shared by ' + message.author.username,
								iconURL: message.author.avatarURL(),
							})
							.setTimestamp();
						const interaction = new MessageActionRow().addComponents(
							new MessageButton()
								.setLabel('Play In Cider')
								.setStyle('LINK')
								.setURL(play_link),
							new MessageButton()
								.setLabel('View In Cider')
								.setStyle('LINK')
								.setURL(view_link)
						);
						try {
							message.delete();
							return message.channel.send({
								embeds: [embed],
								components: [interaction],
							});
						} catch (e) {}
					})
					.catch(() => null);
			} catch (e) {}
		}
	},
};
