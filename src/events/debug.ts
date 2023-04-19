import consola from 'consola';
import { Events } from 'discord.js'

export default {
    name: Events.Debug,
    once: false,
    devOnly: true,
    execute(info: string) {
        consola.debug("\x1b[33m%s\x1b[90m%s\x1b[0m", "[DJS]", info);
    }
}