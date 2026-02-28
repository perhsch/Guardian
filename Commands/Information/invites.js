const Discord = require('discord.js');
const emojis = require('../../Config/emojis.json');

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    enabled: true,
    data: new Discord.SlashCommandBuilder()
        .setName('invites')
        .setDMPermission(false)
        .setDescription('Displays the number of invites of specified user.')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('Specified user will be used to display their invites.')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const inviter = interaction.options.getUser('user') ?? interaction.user;

        const invites = await interaction.guild.invites.fetch();

        const userInvites = invites.filter((invite) => invite.inviter.id === inviter.id);

        let remainingInvites = 0;
        let fakeInvites = 0;

        userInvites.forEach((invite) => {
            const uses = invite.uses || 0;
            const maxUses = invite.maxUses || 0;

            if (uses === 0) {
                remainingInvites++;
            } else if (maxUses > 0 && uses > maxUses) {
                fakeInvites++;
            } else {
                // This counts as successful invites
            }
        });

        const successfulInvites = userInvites.reduce((total, invite) => total + (invite.uses || 0), 0) - fakeInvites;
        const successRate = userInvites.size > 0 ? Math.round((successfulInvites / userInvites.reduce((total, invite) => total + (invite.uses || 0), 1)) * 100) : 0;

        const embed = new Discord.EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: '🔗 Invite Statistics',
                iconURL: inviter.displayAvatarURL({ dynamic: true, size: 256 }),
            })
            .setTitle(`📊 ${inviter.username}'s Invite Analytics`)
            .setDescription(
                `Here's a comprehensive breakdown of **${inviter.tag}**'s invite performance on **${interaction.guild.name}**`
            )
            .setThumbnail(inviter.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: '🎯 Total Invites',
                    value: `\`\`\`${userInvites.size}\`\`\``,
                    inline: true,
                },
                {
                    name: '⏳ Unused Invites',
                    value: `\`\`\`${remainingInvites}\`\`\``,
                    inline: true,
                },
                {
                    name: '✅ Successful Joins',
                    value: `\`\`\`${successfulInvites}\`\`\``,
                    inline: true,
                },
                {
                    name: '❌ Left/Invalid',
                    value: `\`\`\`${fakeInvites}\`\`\``,
                    inline: true,
                },
                {
                    name: '📈 Success Rate',
                    value: `\`\`\`${successRate}%\`\`\``,
                    inline: true,
                },
                {
                    name: '🏆 Rank',
                    value: `\`\`\`${successfulInvites >= 10 ? 'Gold' : successfulInvites >= 5 ? 'Silver' : successfulInvites >= 1 ? 'Bronze' : 'None'}\`\`\``,
                    inline: true,
                }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag} • Guardian Bot`,
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        if (userInvites.size === 0) {
            embed.setDescription(
                `**${inviter.tag}** hasn't created any invites for **${interaction.guild.name}** yet.\n\n💡 *Tip: Create an invite link in the server settings to start inviting people!*`
            );
        }

        return interaction.editReply({ embeds: [embed] });
    },
};
