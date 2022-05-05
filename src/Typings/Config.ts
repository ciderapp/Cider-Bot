import { ColorResolvable } from 'discord.js';
import { ClientOptions } from 'discord.js';
export interface Config {
  color: ColorResolvable;
  botOptions: ClientOptions;
}
