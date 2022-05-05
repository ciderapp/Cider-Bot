import {
  Guild,
  GuildMember,
  CommandInteractionOptionResolver,
  CommandInteraction,
  NewsChannel,
  TextChannel,
  ThreadChannel,
  User,
} from 'discord.js';
import { Bot } from '../Structures/BotClient.js';

export interface RunOptions {
  interaction: CommandInteraction<'cached'>;
  options: CommandInteractionOptionResolver;
  bot: Bot;
  guild: Guild;
  member: GuildMember;
  user: User;
  channel: TextChannel | NewsChannel | ThreadChannel;
}
