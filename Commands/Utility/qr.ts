import { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import QRCode from 'qrcode';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('qr')
        .setDescription('Generate advanced QR codes with customization')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text/URL to encode in QR code')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('size')
                .setDescription('QR code size (100-500)')
                .setMinValue(100)
                .setMaxValue(500))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('QR code color')
                .addChoices(
                    { name: '🔴 Red', value: '#FF0000' },
                    { name: '🔵 Blue', value: '#0000FF' },
                    { name: '🟢 Green', value: '#00FF00' },
                    { name: '🟡 Yellow', value: '#FFFF00' },
                    { name: '🟣 Purple', value: '#800080' },
                    { name: '⚫ Black', value: '#000000' }
                ))
        .addStringOption(option =>
            option.setName('background')
                .setDescription('Background color')
                .addChoices(
                    { name: '⚫ Black', value: '#000000' },
                    { name: '⚪ White', value: '#FFFFFF' },
                    { name: '🔵 Light Blue', value: '#E3F2FD' },
                    { name: '🟢 Light Green', value: '#E8F5E8' },
                    { name: '🟡 Light Yellow', value: '#FFFDE7' }
                ))
        .addBooleanOption(option =>
            option.setName('transparent')
                .setDescription('Transparent background (overrides background color)')),

    async execute(interaction: ChatInputCommandInteraction) {
        const text = interaction.options.getString('text', true);
        const size = interaction.options.getInteger('size') || 200;
        const color = interaction.options.getString('color') || '#000000';
        const background = interaction.options.getString('background') || '#FFFFFF';
        const transparent = interaction.options.getBoolean('transparent') || false;

        await interaction.deferReply();

        try {
            const qrOptions: any = {
                width: size,
                margin: 2,
                color: {
                    dark: color,
                    light: transparent ? '#00000000' : background
                }
            };

            const qrBuffer = await QRCode.toBuffer(text, qrOptions) as unknown as Buffer;
            const attachment = new AttachmentBuilder(qrBuffer, { name: 'guardian-qr.png' });

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('📱 QR Code Generated')
                .setDescription(`**Encoded Text:** ${text.length > 100 ? text.substring(0, 100) + '...' : text}`)
                .addFields(
                    { name: '🔢 Size', value: `${size}x${size}px`, inline: true },
                    { name: '🎨 Color', value: color, inline: true },
                    { name: '🖼️ Background', value: transparent ? 'Transparent' : background, inline: true },
                    { name: '📏 Character Count', value: text.length.toString(), inline: true },
                    { name: '📊 Data Type', value: /^https?:\/\//.test(text) ? 'URL' : 'Text', inline: true }
                )
                .setThumbnail('attachment://guardian-qr.png')
                .setFooter({ 
                    text: 'Guardian Bot • Advanced QR Generator',
                    iconURL: interaction.client.user?.displayAvatarURL()
                })
                .setTimestamp();

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setLabel('🔄 Regenerate')
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId(`qr_regenerate_${encodeURIComponent(text)}_${size}_${color}_${background}_${transparent}`),
                new ButtonBuilder()
                    .setLabel('📋 Copy Text')
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId(`qr_copy_${encodeURIComponent(text)}`)
            );

            const message = await interaction.editReply({ 
                embeds: [embed], 
                files: [attachment],
                components: [row]
            });

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 300000
            });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.user.id !== interaction.user.id) {
                    await buttonInteraction.reply({
                        content: '❌ These buttons are only for the command user.',
                        ephemeral: true
                    });
                    return;
                }

                await buttonInteraction.deferUpdate();

                const customId = buttonInteraction.customId;

                if (customId.startsWith('qr_regenerate_')) {
                    const parts = customId.split('_');
                    const newText = decodeURIComponent(parts[2] || '');
                    const newSize = parseInt(parts[3] || '200');
                    const newColor = parts[4] || '#000000';
                    const newBackground = parts[5] || '#FFFFFF';
                    const newTransparent = parts[6] === 'true';

                    try {
                        const newQrBuffer = await QRCode.toBuffer(newText, {
                            width: newSize,
                            margin: 2,
                            color: {
                                dark: newColor,
                                light: newTransparent ? '#00000000' : newBackground
                            }
                        });

                        const newAttachment = new AttachmentBuilder(newQrBuffer, { name: 'guardian-qr-new.png' });

                        const newEmbed = new EmbedBuilder()
                            .setColor(0x00ff00)
                            .setTitle('📱 QR Code Regenerated')
                            .setDescription(`**Encoded Text:** ${newText.length > 100 ? newText.substring(0, 100) + '...' : newText}`)
                            .addFields(
                                { name: '🔢 Size', value: `${newSize}x${newSize}px`, inline: true },
                                { name: '🎨 Color', value: newColor, inline: true },
                                { name: '🖼️ Background', value: newTransparent ? 'Transparent' : newBackground, inline: true }
                            )
                            .setThumbnail('attachment://guardian-qr-new.png')
                            .setFooter({ text: 'Guardian Bot • QR Regenerated' })
                            .setTimestamp();

                        await buttonInteraction.followUp({ 
                            embeds: [newEmbed], 
                            files: [newAttachment],
                            ephemeral: true
                        });
                    } catch (error) {
                        await buttonInteraction.followUp({
                            content: '❌ Failed to regenerate QR code',
                            ephemeral: true
                        });
                    }
                } else if (customId === 'qr_colors') {
                    const colorRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setLabel('🔴 Red')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`qr_color_red_${encodeURIComponent(text)}_${size}_${background}_${transparent}`),
                        new ButtonBuilder()
                            .setLabel('🔵 Blue')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`qr_color_blue_${encodeURIComponent(text)}_${size}_${background}_${transparent}`),
                        new ButtonBuilder()
                            .setLabel('🟢 Green')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`qr_color_green_${encodeURIComponent(text)}_${size}_${background}_${transparent}`),
                        new ButtonBuilder()
                            .setLabel('🟡 Yellow')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`qr_color_yellow_${encodeURIComponent(text)}_${size}_${background}_${transparent}`)
                    );

                    await buttonInteraction.followUp({
                        content: '🎨 Choose a color:',
                        components: [colorRow],
                        ephemeral: true
                    });
                } else if (customId.startsWith('qr_color_')) {
                    const parts = customId.split('_');
                    const newColor = parts[2] || '';
                    const originalText = decodeURIComponent(parts[3] || '');
                    const originalSize = parseInt(parts[4] || '200');
                    const originalBackground = parts[5] || '#FFFFFF';
                    const originalTransparent = parts[6] === 'true';

                    try {
                        const colorMap: { [key: string]: string } = {
                            'red': '#FF0000',
                            'blue': '#0000FF', 
                            'green': '#00FF00',
                            'yellow': '#FFFF00'
                        };
                        
                        const newColorHex = colorMap[newColor as keyof typeof colorMap] || '#000000';
                        
                        const colorQrBuffer = await QRCode.toBuffer(originalText, {
                            width: originalSize,
                            margin: 2,
                            color: {
                                dark: newColorHex,
                                light: originalTransparent ? '#00000000' : originalBackground
                            }
                        }) as unknown as Buffer;

                        const colorAttachment = new AttachmentBuilder(colorQrBuffer, { name: 'guardian-qr-updated.png' });

                        const updatedEmbed = new EmbedBuilder()
                            .setColor(0x00ff00)
                            .setTitle('📱 QR Code Updated')
                            .setDescription(`**Encoded Text:** ${originalText.length > 100 ? originalText.substring(0, 100) + '...' : originalText}`)
                            .addFields(
                                { name: '🔢 Size', value: `${originalSize}x${originalSize}px`, inline: true },
                                { name: '🎨 Color', value: newColorHex, inline: true },
                                { name: '🖼️ Background', value: originalTransparent ? 'Transparent' : originalBackground, inline: true },
                                { name: '📏 Character Count', value: originalText.length.toString(), inline: true },
                                { name: '📊 Data Type', value: /^https?:\/\//.test(originalText) ? 'URL' : 'Text', inline: true }
                            )
                            .setThumbnail('attachment://guardian-qr-updated.png')
                            .setFooter({ 
                                text: 'Guardian Bot • Color Updated',
                                iconURL: buttonInteraction.client.user?.displayAvatarURL()
                            })
                            .setTimestamp();

                        const updatedColorRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setLabel('🔄 Regenerate')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId(`qr_regenerate_${encodeURIComponent(originalText)}_${originalSize}_${newColorHex}_${originalBackground}_${originalTransparent}`),
                            new ButtonBuilder()
                                .setLabel('📋 Copy Text')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId(`qr_copy_${encodeURIComponent(originalText)}`)
                        );

                        await buttonInteraction.update({ 
                            embeds: [updatedEmbed], 
                            files: [colorAttachment],
                            components: [updatedColorRow]
                        });
                    } catch (error) {
                        await buttonInteraction.followUp({
                            content: '❌ Failed to change QR color',
                            ephemeral: true
                        });
                    }
                } else if (customId.startsWith('qr_resize_')) {
                    const parts = customId.split('_');
                    const resizeText = decodeURIComponent(parts[2] || '');
                    const resizeColor = parts[3] || '#000000';
                    const resizeBackground = parts[4] || '#FFFFFF';
                    const resizeTransparent = parts[5] === 'true';

                    const sizeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setLabel('📱 Small (150)')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`qr_size_150_${encodeURIComponent(resizeText)}_${resizeColor}_${resizeBackground}_${resizeTransparent}`),
                        new ButtonBuilder()
                            .setLabel('📐 Medium (300)')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`qr_size_300_${encodeURIComponent(resizeText)}_${resizeColor}_${resizeBackground}_${resizeTransparent}`),
                        new ButtonBuilder()
                            .setLabel('🖼️ Large (450)')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`qr_size_450_${encodeURIComponent(resizeText)}_${resizeColor}_${resizeBackground}_${resizeTransparent}`)
                    );

                    await buttonInteraction.followUp({
                        content: '📏 Choose a size:',
                        components: [sizeRow],
                        ephemeral: true
                    });
                } else if (customId.startsWith('qr_size_')) {
                    const parts = customId.split('_');
                    const newSize = parseInt(parts[2] || '200');
                    const sizeText = decodeURIComponent(parts[3] || '');
                    const sizeColor = parts[4] || '#000000';
                    const sizeBackground = parts[5] || '#FFFFFF';
                    const sizeTransparent = parts[6] === 'true';

                    try {
                        const sizeQrBuffer = await QRCode.toBuffer(sizeText, {
                            width: newSize,
                            margin: 2,
                            color: {
                                dark: sizeColor,
                                light: sizeTransparent ? '#00000000' : sizeBackground
                            }
                        }) as unknown as Buffer;

                        const sizeAttachment = new AttachmentBuilder(sizeQrBuffer, { name: 'guardian-qr-resized.png' });

                        const resizedEmbed = new EmbedBuilder()
                            .setColor(0x00ff00)
                            .setTitle('📱 QR Code Updated')
                            .setDescription(`**Encoded Text:** ${sizeText.length > 100 ? sizeText.substring(0, 100) + '...' : sizeText}`)
                            .addFields(
                                { name: '🔢 Size', value: `${newSize}x${newSize}px`, inline: true },
                                { name: '🎨 Color', value: sizeColor, inline: true },
                                { name: '🖼️ Background', value: sizeTransparent ? 'Transparent' : sizeBackground, inline: true },
                                { name: '📏 Character Count', value: sizeText.length.toString(), inline: true },
                                { name: '📊 Data Type', value: /^https?:\/\//.test(sizeText) ? 'URL' : 'Text', inline: true }
                            )
                            .setThumbnail('attachment://guardian-qr-resized.png')
                            .setFooter({ 
                                text: 'Guardian Bot • Size Updated',
                                iconURL: buttonInteraction.client.user?.displayAvatarURL()
                            })
                            .setTimestamp();

                        const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setLabel('🔄 Regenerate')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId(`qr_regenerate_${encodeURIComponent(sizeText)}_${newSize}_${sizeColor}_${sizeBackground}_${sizeTransparent}`),
                            new ButtonBuilder()
                                .setLabel('📋 Copy Text')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId(`qr_copy_${encodeURIComponent(sizeText)}`)
                        );

                        await buttonInteraction.update({ 
                            embeds: [resizedEmbed], 
                            files: [sizeAttachment],
                            components: [updatedRow]
                        });
                    } catch (error) {
                        await buttonInteraction.followUp({
                            content: '❌ Failed to resize QR code',
                            ephemeral: true
                        });
                    }
                } else if (customId.startsWith('qr_copy_')) {
                    const copyText = decodeURIComponent(customId.replace('qr_copy_', ''));
                    await buttonInteraction.followUp({
                        content: `📋 **Text copied:** ${copyText}`,
                        ephemeral: true
                    });
                }
            });

        } catch (error) {
            await interaction.editReply({
                content: '❌ Failed to generate QR code',
            });
        }
    }
};
