const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, ChannelType } = require('discord.js');

const EmbedGenerator = require('../../Functions/embedGenerator');
const { sendModLog } = require('../../Functions/modLog');

module.exports = {
    enabled: true,

  data: new SlashCommandBuilder()
    .setName('hide')
    .setDescription('hide a text channel.')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Text channel mention to hide.')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction, client, dbGuild) {

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      const noPermsEmbed = EmbedGenerator.basicEmbed()
        .setDescription("You don't have `ManageChannels` permission.");
      return interaction.reply({
        embeds: [noPermsEmbed],
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel('channel');
    channel.edit({
      permissionOverwrites: [
        { type: 'role', id: interaction.guild.roles.everyone, deny: ['ViewChannel'] },
      ],
    });

    const logEmbed = EmbedGenerator.basicEmbed(
      [
        `- Moderator: ${interaction.user.tag}`,
        `- Channel: ${channel.name} (<#${channel.id}>)`,
      ].join('\n')
    ).setTitle('/hide command used');
    await sendModLog(interaction.guild, dbGuild, logEmbed);

    const embed = EmbedGenerator.basicEmbed()
      .setDescription(`The Channel ${channel.name} Has Been Hidden Successfully`);

    await interaction.reply({
      embeds: [embed],
    });

  }

}