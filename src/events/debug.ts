import consola from 'consola';
import { Events } from 'discord.js'

export default {
    name: Events.Debug,
    once: false,
    devOnly: true,
    execute(info: string) {
        consola.debug(info);
    }
}