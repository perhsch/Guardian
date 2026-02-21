const Discord = require(`discord.js`);

const EmbedGenerator = require('../../Functions/embedGenerator');
const { sendModLog } = require('../../Functions/modLog');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('giveroleall')
        .setDescription('Gives a specified role to all members in the server.')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.BanMembers)
        .addRoleOption((option) =>
            option
                .setName('role')
                .setDescription('The role to give to all members.')
                .setRequired(true)
        ),
    async execute(interaction, client, dbGuild) {
        const role = interaction.options.getRole('role');
        const members = interaction.guild.members.cache;
        members.forEach((member) => {
            member.roles.add(role);
        });
        const logEmbed = EmbedGenerator.basicEmbed(
            [
                `- Moderator: ${interaction.user.tag}`,
                `- Role: ${role.name} (${role.id})`,
                `- Members affected: ${members.size}`,
            ].join('\n')
        ).setTitle('/giveroleall command used');
        await sendModLog(interaction.guild, dbGuild, logEmbed);
        await interaction.reply(`Successfully gave the ${role.name} role to all members.`);
    },
};
