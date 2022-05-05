import { MongoClient } from 'mongodb';
const mongo = new MongoClient(require('../Structures/Local').mongo());
import fetch from 'node-fetch';
const consola = require('consola');

interface Release {
	url: string;
	html_url: string;
	assets_url: string; // TODO: need
	upload_url: string;
	tarball_url: string;
	zipball_url: string;
	id: number; // TODO: need
	node_id: string;
	tag_name: string; // TODO: need
	target_commitish: string;
	name: string; // TODO: need
	body: string;
	draft: boolean;
	prerelease: boolean;
	created_at: string;
	published_at: string; // TODO: need
	author: {
		login: string;
		id: number;
		node_id: string;
		avatar_url: string;
		gravatar_id: string;
		url: string;
		html_url: string;
		followers_url: string;
		following_url: string;
		gists_url: string;
		starred_url: string;
		subscriptions_url: string;
		organizations_url: string;
		repos_url: string;
		events_url: string;
		received_events_url: string;
		type: string;
		site_admin: boolean;
	};
	assets: {
		// TODO: need
		url: string;
		browser_download_url: string; // TODO: need
		id: number;
		node_id: string;
		name: string;
		label: string;
		state: string;
		content_type: string;
		size: number;
		download_count: number;
		created_at: string;
		updated_at: string;
		uploader: {
			login: string;
			id: number;
			node_id: string;
			avatar_url: string;
			gravatar_id: string;
			url: string;
			html_url: string;
			followers_url: string;
			following_url: string;
			gists_url: string;
			starred_url: string;
			subscriptions_url: string;
			organizations_url: string;
			repos_url: string;
			events_url: string;
			received_events_url: string;
			type: string;
			site_admin: boolean;
		};
	}[];
}

export class Mongo {
	static async init() {
		await mongo.connect();
		consola.success('[mongo] Connected!');
	}

	static async addDonation(transaction: any, userId: any) {
		try {
			mongo
				.db('connect')
				.collection('users')
				.updateOne(
					{ _id: userId },
					{ $addToSet: { donations: transaction } },
					{ upsert: true }
				);
		} catch (e) {
			consola.error('Mongo Not Available. \n' + e);
		}
		return;
	}

	static async commandCounter(command: any) {
		try {
			mongo
				.db('bot')
				.collection('analytics')
				.updateOne(
					{ name: `command-${command}` },
					{ $set: { lastUsed: Date.now() }, $inc: { count: 1 } },
					{ upsert: true }
				);
		} catch (e) {
			consola.error('Mongo Not Available. \n' + e);
		}
	}
	static async replyCounter(reply: any) {
		try {
			mongo
				.db('bot')
				.collection('analytics')
				.updateOne(
					{ name: `autoreply-${reply}` },
					{ $set: { lastUsed: Date.now() }, $inc: { count: 1 } },
					{ upsert: true }
				);
		} catch (e) {
			consola.error('Mongo Not Availible. \n' + e);
		}
	}
	static async logRPMetadata(listenerData: {
		songName: any;
		artistName: any;
		userid: any;
	}) {
		try {
			mongo
				.db('bot')
				.collection('rp-data')
				.updateOne(
					{ song: `${listenerData.songName} - ${listenerData.artistName}` },
					{
						$set: { lastListened: Date.now() },
						$inc: { count: 1 },
						$addToSet: { listeners: listenerData.userid },
					},
					{ upsert: true }
				);
		} catch (e) {
			consola.error('Mongo Not Available. \n' + e);
		}
	}

	static async syncReleaseData(branch: string) {
		const data = await fetch(
			`https://api.github.com/repos/ciderapp/cider-releases/releases?per_page=100`
		);
		const releases = (await data.json()) as Release[]; // CYA THEN THANKS AGAIN

		let macDmg = '';
		let macPkg = '';
		if (branch == 'develop') {
			macDmg =
				'https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.dmg';
			macPkg =
				'https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.pkg';
		}
		for (let release of releases) {
			if (
				String(release.name)
					.split(' ')
					[String(release.name).split(' ').length - 1].replace(/[(+)]/g, '') ===
				branch
			) {
				mongo
					.db('bot')
					.collection('releases')
					.updateOne(
						{ branch: `${branch}` },
						{
							$set: {
								tag: `${release.tag_name}`,
								lastUpdated: `${release.published_at}`,
								jsDate: `${new Date(release.published_at).getTime()}`, //for timestamping
								releaseID: `${release.id}`,
								links: {
									AppImage: `${release.assets[1].browser_download_url}`,
									exe: `${release.assets[2].browser_download_url}`,
									winget: `${release.assets[4].browser_download_url}`,
									deb: `${release.assets[6].browser_download_url}`,
									snap: `${release.assets[7].browser_download_url}`,
									dmg: `${macDmg}`,
									pkg: `${macPkg}`,
								},
							},
						},
						{ upsert: true }
					);
				consola.info(`[mongo] Updated ${branch} details`);
				return release;
			}
		}
		return null;
	}

	static async getLatestRelease(branch: any) {
		let release = await mongo
			.db('bot')
			.collection('releases')
			.find({ branch: `${branch}` })
			.toArray();
		if (release.length == 0) {
			return null;
		}
		return release[0];
	}

	static async getActiveUsers() {
		let activeUsers = await mongo
			.db('bot')
			.collection('analytics')
			.find({ name: 'currActiveUsers' })
			.toArray();
		if (activeUsers.length == 0) {
			return 0;
		}
		return activeUsers[0].count;
	}

	static async incrementActiveUsers() {
		mongo
			.db('bot')
			.collection('analytics')
			.updateOne(
				{ name: 'currActiveUsers' },
				{ $inc: { count: 1 } },
				{ upsert: true }
			);
	}

	static async decrementActiveUsers() {
		mongo
			.db('bot')
			.collection('analytics')
			.updateOne(
				{ name: 'currActiveUsers' },
				{ $inc: { count: -1 } },
				{ upsert: true }
			);
	}

	static async incrementTotalUsers() {
		mongo
			.db('bot')
			.collection('analytics')
			.updateOne(
				{ name: 'totalUsers' },
				{ $inc: { count: 1 } },
				{ upsert: true }
			);
	}

	static async getTotalUsers() {
		let totalUsers = await mongo
			.db('bot')
			.collection('analytics')
			.find({ name: 'totalUsers' })
			.toArray();
		if (totalUsers.length == 0) {
			return 0;
		}
		return totalUsers[0].count;
	}

	static async setActiveUsers(count: any) {
		mongo
			.db('bot')
			.collection('analytics')
			.updateOne(
				{ name: 'currActiveUsers' },
				{ $set: { count: count } },
				{ upsert: true }
			);
	}

	static async setTotalUsers(count: any) {
		mongo
			.db('bot')
			.collection('analytics')
			.updateOne(
				{ name: 'totalUsers' },
				{ $set: { count: count } },
				{ upsert: true }
			);
	}
}
