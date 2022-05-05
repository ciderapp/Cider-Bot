import { config } from './Structures/BotConfig.js';
import { Bot } from './Structures/BotClient.js';

const bot = new Bot(config);
bot.start();
