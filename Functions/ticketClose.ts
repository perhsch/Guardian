import Discord from 'discord.js';
import EmbedGenerator from './embedGenerator.ts';
import Tickets, { ITicket } from '../Schemas/Tickets.ts';

const baseUrl = () =>
    process.env.LIVE === 'true' ? 'https://guardianbot.space' : 'http://localhost:3001';

/**
 * Build a plain-text transcript from stored ticket messages.
 * @param {ITicket} ticket - Ticket document with messages array
 * @param {Discord.Client} client - Bot client to resolve user tags
 * @returns {Promise<string>}
 */
export async function buildTranscriptText(ticket: ITicket, client: Discord.Client): Promise<string> {
    const lines = [
        `Ticket ${ticket._id} | Guild ${ticket.guild}`,
        '---',
        '',
    ];
    for (const m of ticket.messages || []) {
        const user = await client.users.fetch(m.user).catch(() => null);
        const tag = user ? user.tag : `User ${m.user}`;
        const time = m.time ? new Date(m.time).toISOString() : '';
        lines.push(`[${time}] ${tag}: ${(m.message || '').replace(/\n/g, ' ')}`);
        if (m.images && m.images.length) {
            lines.push(`  Attachments: ${m.images.join(', ')}`);
        }
    }
    return lines.join('\n');
}

/**
 * Close a ticket channel: update DB, notify participants (with optional transcript), delete channel.
 * @param {Discord.Client} client
 * @param {Discord.Guild} guild
 * @param {Discord.TextChannel | Discord.ThreadChannel} channel - The ticket channel to close (will be deleted)
 * @param {ITicket} ticket - Ticket document
 * @param {string} closedByUserId - User ID of who closed the ticket
 * @param {string} [logChannelId] - Optional channel ID to post transcript to (e.g. tickets.logChannel)
 */
export async function closeTicketChannel(
    client: Discord.Client,
    guild: Discord.Guild,
    channel: Discord.TextChannel | Discord.ThreadChannel,
    ticket: ITicket,
    closedByUserId: string,
    logChannelId?: string
): Promise<void> {
    const participantIds = new Set([
        closedByUserId,
        ticket.user,
        ...(ticket.messages || []).map((m: any) => m.user),
    ]);

    await Tickets.updateOne(
        { guild: guild.id, channel: channel.id },
        {
            $set: { active: false },
            $push: {
                messages: {
                    user: closedByUserId,
                    message: 'This ticket has been closed.',
                    time: Date.now(),
                },
            },
        }
    );

    let transcriptText: string | null = null;
    try {
        transcriptText = await buildTranscriptText(ticket, client);
    } catch (_) {}

    const transcriptAttachment =
        transcriptText &&
        new Discord.AttachmentBuilder(Buffer.from(transcriptText, 'utf8'), {
            name: `ticket-${ticket._id}.txt`,
        });

    const embed = EmbedGenerator.basicEmbed(
        `A ticket you were involved in has been closed.\nYou can view an export of the ticket [here](${baseUrl()}/guilds/${ticket.guild}/tickets/${ticket._id.toString()}).`
    ).setTitle(`${channel.name} | Closed`);

    const dmPayload: Discord.MessageCreateOptions = { embeds: [embed] };
    if (transcriptAttachment) dmPayload.files = [transcriptAttachment];

    for (const id of participantIds) {
        if (!id) continue;
        const user = await client.users.fetch(id).catch(() => null);
        if (user && !user.bot) await user.send(dmPayload as any).catch(() => null);
    }

    if (logChannelId && transcriptText) {
        const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
            const logAttachment = new Discord.AttachmentBuilder(Buffer.from(transcriptText, 'utf8'), {
                name: `ticket-${ticket._id}.txt`,
            });
            const logEmbed = EmbedGenerator.basicEmbed(
                `Ticket **${channel.name}** closed by <@${closedByUserId}>.\nTranscript attached.`
            )
                .setTitle('Ticket closed')
                .setTimestamp();
            await (logChannel as Discord.TextChannel)
                .send({ embeds: [logEmbed], files: [logAttachment] })
                .catch(() => null);
        }
    }

    await channel.delete(`Ticket closed by ${closedByUserId}`).catch(() => null);
}
