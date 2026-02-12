const Discord = require('discord.js');

const EmbedGenerator = require('../../../Functions/embedGenerator');
const { setLockdown } = require('../../../Functions/antiRaidLockdown');
const { sendModLog } = require('../../../Functions/modLog');

module.exports = {
    data: new Discord.SlashCommandSubcommandBuilder()
        .setName('stop_raid')
        .setDescription('Stop the anti-raid protection system if triggered.'),
    /**
     * @param {Discord.ChatInputCommandInteraction} interaction
     * @param {Discord.Client} client
     * @param {import('../../../Classes/GuildsManager').GuildsManager} dbGuild
     */
    async execute(interaction, client, dbGuild) {
        if (!dbGuild.antiraid.raid)
            return EmbedGenerator.errorEmbed(':x: There is currently no ongoing raid!');

        dbGuild.antiraid.raid = false;
        if (dbGuild.antiraid.lockdown.enabled) {
            dbGuild.antiraid.lockdown.active = false;
            await setLockdown(interaction.guild, false);
        }

        const logEmbed = EmbedGenerator.basicEmbed(
            `- Moderator: ${interaction.user.tag}`
        ).setTitle('/antiraid stop_raid command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);

        // Announce in the configured anti-raid channel, if any
        if (dbGuild.antiraid.channel) {
            const announceChannel = await interaction.guild.channels
                .fetch(dbGuild.antiraid.channel)
                .catch(() => null);
            if (announceChannel && announceChannel.isTextBased()) {
                announceChannel
                    .send({
                        embeds: [
                            EmbedGenerator.basicEmbed(
                                `🔓 | Raid mode has been disabled by ${interaction.user.tag}!${
                                    dbGuild.antiraid.lockdown.enabled
                                        ? '\n🔓 | This server has left lockdown mode!'
                                        : ''
                                }`
                            ),
                        ],
                    })
                    .catch(() => null);
            }
        }

        return EmbedGenerator.basicEmbed(
            `🔓 | Raid mode has been disabled!${
                dbGuild.antiraid.lockdown.enabled
                    ? '\n🔓 | This server has left lockdown mode!'
                    : ''
            }`
        );
    },
};
