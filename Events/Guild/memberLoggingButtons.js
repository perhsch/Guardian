const Discord = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');

module.exports = {
    name: 'interactionCreate',
    /**
     * @param {Discord.Interaction} interaction
     * @param {Discord.Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        const splitArray = interaction.customId.split('-');
        if (splitArray[0] !== 'MemberLogging') return;

        const member = await interaction.guild.members.fetch(splitArray[2]).catch(() => null);
        if (!member) return;

        const errorArray = [];
        const action = splitArray[1];

        if (action === 'Ban') {
            if (!interaction.member.permissions.has('BanMembers'))
                errorArray.push('You do not have the required permissions for this action.');
            if (!interaction.guild.members.me.permissions.has('BanMembers'))
                errorArray.push('Bot does not have Ban Members permission.');
        }
        if (action === 'Kick') {
            if (!interaction.member.permissions.has('KickMembers'))
                errorArray.push('You do not have the required permissions for this action.');
            if (!interaction.guild.members.me.permissions.has('KickMembers'))
                errorArray.push('Bot does not have Kick Members permission.');
        }
        if (!member) errorArray.push('This user is no longer in this server.');
        if (!member.moderatable) errorArray.push('This user cannot be moderated by the bot.');

        if (errorArray.length) {
            const errorEmbed = new Discord.EmbedBuilder()
                .setColor(0xed4245)
                .setTitle('❌ Action Denied')
                .setThumbnail(interaction.guild.iconURL({ size: 256 }))
                .setDescription(
                    `>>> **Unable to perform moderation action**\n\n**Issues Found**\n${errorArray.map((err) => `• ${err}`).join('\n')}`
                )
                .addFields({
                    name: '🔧 Required Fixes',
                    value: `• Ensure you have \`Kick Members\` permission\n• Verify target member is in server\n• Check that member can be moderated`,
                    inline: false,
                })
                .setFooter({
                    text: `Guardian Moderation • Permission Error`,
                    iconURL: client.user.displayAvatarURL(),
                })
                .setTimestamp();

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        switch (splitArray[1]) {
            case 'Kick': {
                member
                    .kick(`Kicked by: ${interaction.user.tag} | Member Logging System`)
                    .then(() => {
                        const successEmbed = new Discord.EmbedBuilder()
                            .setColor(0xed4245)
                            .setTitle('👢 Member Kicked')
                            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                            .setDescription(
                                `>>> **Member has been successfully kicked from the server**\n\n**Action Details**\n• **Member**: ${member.user.toString()}\n• **Member Tag**: \`${member.user.tag}\`\n• **Moderator**: ${interaction.user.toString()}\n• **Reason**: Member Logging System`
                            )
                            .addFields(
                                {
                                    name: '📋 Member Information',
                                    value: `• **Joined**: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\n• **ID**: \`${member.id}\`\n• **Roles**: ${member.roles.cache.size} role(s)`,
                                    inline: true,
                                },
                                {
                                    name: '⏰ Action Details',
                                    value: `• **Time**: <t:${Math.floor(Date.now() / 1000)}:R>\n• **Method**: Logging System\n• **Appeal**: Contact server staff`,
                                    inline: true,
                                }
                            )
                            .setFooter({
                                text: `Guardian Moderation • ${interaction.guild.name}`,
                                iconURL: interaction.guild.iconURL(),
                            })
                            .setTimestamp();

                        interaction.reply({ embeds: [successEmbed] });
                    })
                    .catch(() => {
                        const errorEmbed = new Discord.EmbedBuilder()
                            .setColor(0xed4245)
                            .setTitle('❌ Kick Failed')
                            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                            .setDescription(
                                `>>> **Failed to kick member from the server**\n\n**Possible Reasons**\n• Bot lacks \`Kick Members\` permission\n• Member has higher role hierarchy\n• Member is server owner`
                            )
                            .addFields({
                                name: '🔧 Troubleshooting',
                                value: `• Check bot permissions\n• Verify role hierarchy\n• Ensure member is kickable`,
                                inline: false,
                            })
                            .setFooter({
                                text: `Guardian Moderation • Error occurred`,
                                iconURL: client.user.displayAvatarURL(),
                            })
                            .setTimestamp();

                        interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    });

                break;
            }

            case 'Ban': {
                member
                    .ban(`Banned by: ${interaction.user.tag} | Member Logging System`)
                    .then(() => {
                        const successEmbed = new Discord.EmbedBuilder()
                            .setColor(0xed4245)
                            .setTitle('🔨 Member Banned')
                            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                            .setDescription(
                                `>>> **Member has been successfully banned from the server**\n\n**Action Details**\n• **Member**: ${member.user.toString()}\n• **Member Tag**: \`${member.user.tag}\`\n• **Moderator**: ${interaction.user.toString()}\n• **Reason**: Member Logging System`
                            )
                            .addFields(
                                {
                                    name: '📋 Member Information',
                                    value: `• **Joined**: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\n• **Account Created**: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n• **ID**: \`${member.id}\``,
                                    inline: true,
                                },
                                {
                                    name: '⚖️ Ban Details',
                                    value: `• **Time**: <t:${Math.floor(Date.now() / 1000)}:R>\n• **Method**: Logging System\n• **Duration**: Permanent\n• **Appeal**: Contact server staff`,
                                    inline: true,
                                }
                            )
                            .setFooter({
                                text: `Guardian Moderation • ${interaction.guild.name}`,
                                iconURL: interaction.guild.iconURL(),
                            })
                            .setTimestamp();

                        interaction.reply({ embeds: [successEmbed] });
                    })
                    .catch(() => {
                        const errorEmbed = new Discord.EmbedBuilder()
                            .setColor(0xed4245)
                            .setTitle('❌ Ban Failed')
                            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                            .setDescription(
                                `>>> **Failed to ban member from the server**\n\n**Possible Reasons**\n• Bot lacks \`Ban Members\` permission\n• Member has higher role hierarchy\n• Member is server owner`
                            )
                            .addFields({
                                name: '🔧 Troubleshooting',
                                value: `• Check bot permissions\n• Verify role hierarchy\n• Ensure member is bannable`,
                                inline: false,
                            })
                            .setFooter({
                                text: `Guardian Moderation • Error occurred`,
                                iconURL: client.user.displayAvatarURL(),
                            })
                            .setTimestamp();

                        interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    });

                break;
            }
        }
    },
};
