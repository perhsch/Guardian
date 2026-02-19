const Discord = require('discord.js');
const emojis = require('../../Config/emojis.json');

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
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
        let bonusInvites = 0;

        userInvites.forEach((invite) => {
            const uses = invite.uses;
            const maxUses = invite.maxUses;

            if (uses === 0) {
                remainingInvites++;
            } else if (uses > maxUses) {
                fakeInvites++;
            } else if (uses <= maxUses) {
                bonusInvites += maxUses - uses;
            }
        });

        const embed = new Discord.EmbedBuilder()
            .setColor('#9B59B6')
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
                    name: '⏳ Remaining Invites',
                    value: `\`\`\`${remainingInvites}\`\`\``,
                    inline: true,
                },
                {
                    name: '✅ Successful Invites',
                    value: `\`\`\`${userInvites.size - remainingInvites - fakeInvites}\`\`\``,
                    inline: true,
                },
                {
                    name: '❌ Fake/Left Invites',
                    value: `\`\`\`${fakeInvites}\`\`\``,
                    inline: true,
                },
                {
                    name: '🎁 Bonus Potential',
                    value: `\`\`\`${bonusInvites}\`\`\``,
                    inline: true,
                },
                {
                    name: '📈 Success Rate',
                    value: `\`\`\`${userInvites.size > 0 ? Math.round(((userInvites.size - remainingInvites - fakeInvites) / userInvites.size) * 100) : 0}%\`\`\``,
                    inline: true,
                }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag} • ${new Date().toLocaleDateString()}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        if (userInvites.size === 0) {
            embed.setDescription(
                `**${inviter.tag}** hasn't created any invites for **${interaction.guild.name}** yet.\n\n💡 *Tip: Create an invite link in the server settings or use \`/createinvite\` to start inviting people!*`
            );
        }

        return interaction.editReply({ embeds: [embed] });
    },
};
