import { Bot } from '../Structures/BotClient.js';
import { ClientEvents } from 'discord.js';

export interface Event {
  event: keyof ClientEvents;
  once?: boolean;
  run(bot: Bot, ...args: any[]): Promise<void>;
}
