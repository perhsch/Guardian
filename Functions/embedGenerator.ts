import { EmbedBuilder, ChatInputCommandInteraction, MessageComponentInteraction, Guild, ButtonBuilder, ActionRowBuilder, ButtonStyle, TextChannel } from 'discord.js';
import Moment from 'moment';
import ms from 'ms';
import { translateResponse, translateText } from './translate.ts';

/**
 * @param description 
 */
export function basicEmbed(description?: string): EmbedBuilder {
    const embed = new EmbedBuilder().setColor('Green');
    if (description) embed.setDescription(description);

    return embed;
}

/**
 * @param description 
 */
export function errorEmbed(description: string = 'There was an error.'): EmbedBuilder {
    return new EmbedBuilder().setColor('Red').setDescription(description);
}

/**
 * @param guild 
 * @param issuer 
 * @param type 
 * @param duration 
 * @param expires 
 * @param reason 
 */
export function infractionEmbed(
    guild: Guild,
    issuer: string,
    type: string,
    duration: number | null,
    expires: number | null,
    reason: string = 'Unspecified reason.'
): EmbedBuilder {
    let durationString: string = 'N/A';
    let expiresString: string = 'N/A';

    if (duration !== null && !isNaN(duration)) {
        if (!isFinite(duration)) {
            durationString = 'Permanent';
        } else {
            durationString = ms(duration, { long: true });
            if (expires !== null) {
                expiresString = `<t:${Moment(expires).unix()}:R>(<t:${Moment(expires).unix()}:f>)`;
            }
        }
    }

    return new EmbedBuilder()
        .setColor('Blue')
        .setTitle(`${type} | Infraction`)
        .setThumbnail(guild.iconURL())
        .setDescription(
            [
                `You have been issued a ${type.toLowerCase()} in **${guild.name}**`,
                '',
                `**Issuer**: <@${issuer}>`,
                `**Duration**: ${durationString}`,
                `**Expires**: ${expiresString}`,
                `**Reason**: ${reason}`,
            ].join('\n')
        )
        .setTimestamp();
}

/**
 *
 * @param interaction 
 * @param embeds 
 * @param ephemeral 
 * @param targetLang 
 */
export async function pagesEmbed(
    interaction: ChatInputCommandInteraction,
    embeds: EmbedBuilder[],
    ephemeral: boolean = false,
    targetLang: string | null = null
) {
    if (embeds.length === 0)
        return interaction.reply({ content: 'There was an error.', ephemeral: true });
    
    if (embeds.length === 1) {
        if (targetLang && targetLang.toLowerCase() !== 'en') {
            await translateResponse({ embeds, ephemeral }, targetLang);
        }
        return interaction.reply({
            embeds: [embeds[0]!.setFooter({ text: 'Page 1/1' })],
            ephemeral: ephemeral,
        });
    }

    if (targetLang && targetLang.toLowerCase() !== 'en') {
        await translateResponse({ embeds, ephemeral }, targetLang);
    }

    let page = 0;
    const replyPayload: any = {
        embeds: [embeds[page]!.setFooter({ text: `Page ${page + 1}/${embeds.length}` })],
        components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents([
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setEmoji('◀️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setEmoji('▶️')
                    .setStyle(ButtonStyle.Primary),
            ]),
        ],
        ephemeral: ephemeral,
        fetchReply: true,
    };

    let sent: any;
    try {
        sent = await interaction.reply(replyPayload);
    } catch (err) {
        try {
            sent = await interaction.followUp({ ...replyPayload, fetchReply: true });
        } catch (err2) {
            if (interaction.channel && (interaction.channel as TextChannel).send) {
                const nonEphemeralPayload = { ...replyPayload };
                delete nonEphemeralPayload.ephemeral;
                delete nonEphemeralPayload.fetchReply;
                sent = await (interaction.channel as TextChannel).send(nonEphemeralPayload).catch(() => null);
            }
        }
    }

    if (!sent) return;
    
    const filter = (i: MessageComponentInteraction) =>
        ['previous', 'next'].includes(i.customId) &&
        i.message.id === sent.id &&
        interaction.user.id === i.user.id;
        
    const collector = sent.createMessageComponentCollector({ filter, time: 120000 });

    const getFooterText = (p: number) => `Page ${p + 1}/${embeds.length}`;
    const maybeTranslateFooter = async (text: string) =>
        targetLang && targetLang.toLowerCase() !== 'en'
            ? await translateText(text, targetLang)
            : text;

    collector.on('collect', async (i: MessageComponentInteraction) => {
        if (i.customId === 'previous') {
            page = Math.max(0, page - 1);
        } else if (i.customId === 'next') {
            page = Math.min(embeds.length - 1, page + 1);
        }
        const footerText = await maybeTranslateFooter(getFooterText(page));
        await i.update({
            embeds: [embeds[page]!.setFooter({ text: footerText })],
        });
    });
}

export default {
    basicEmbed,
    errorEmbed,
    infractionEmbed,
    pagesEmbed
}
