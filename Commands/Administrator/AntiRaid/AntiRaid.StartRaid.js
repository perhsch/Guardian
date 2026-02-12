const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('start_raid')
        .setDescription('Manually start the anti-raid protection system.'),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        if (dbGuild.antiraid.raid)
            return EmbedGenerator.errorEmbed(':x: A raid is already ongoing!');

        dbGuild.antiraid.raid = true;
        if (dbGuild.antiraid.lockdown.enabled) {
            dbGuild.antiraid.lockdown.active = true;

            // execute lockdown
        }

        const logEmbed = EmbedGenerator.basicEmbed(
            `- Moderator: ${interaction.user.tag}`
        ).setTitle('/antiraid start_raid command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        return EmbedGenerator.basicEmbed(
            `🔒 | Raid mode has been enabled!${
                dbGuild.antiraid.lockdown.enabled
                    ? '\n🔒 | This server has entered lockdown mode!'
                    : ''
            }`
        );
    },
};
