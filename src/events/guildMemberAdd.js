export const event = {
    name: 'guildMemberAdd',

    async execute(member) {
        if(member.guild.id == "1016681050291847278") {
            member.roles.add("1020580042310434857");
        }
    }
}