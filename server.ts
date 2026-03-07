import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import Infractions from './Schemas/Infractions.ts';
import type { GuardianClient } from './types.ts';

export default function createRouter(client: GuardianClient) {
    const router = Router();

    const infractionsLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 5,
    });

    router.use((req: Request, res: Response, next: NextFunction) => {
        if (!req.headers.authorization) {
            res.sendStatus(403);
            return;
        }
        if (req.headers.authorization !== `Bearer ${process.env['DISCORD_TOKEN']}`) {
            res.sendStatus(401);
            return;
        }

        next();
    });

    router.get('/api/commands', async (_req: Request, res: Response) => {
        const commands = [];

        for (const command of client.commands.values()) {
            commands.push({
                name: command.data.name,
                description: command.data.description,
                category: command.category,
                subcommands:
                    command.subCommands?.map((subcommand: any) => {
                        return {
                            name: subcommand.data.name,
                            description: subcommand.data.description,
                        };
                    }) || [],
            });
        }

        res.status(200).json(commands);
    });

    router.get('/api/guilds', async (_req: Request, res: Response) => {
        const guilds = await client.guilds.fetch().catch(() => null);
        if (!guilds) {
            res.sendStatus(500);
            return;
        }

        res.status(200).json(
            guilds.map((guild) => {
                return {
                    id: guild.id,
                    name: guild.name,
                    iconURL: guild.iconURL(),
                    ownerId: (guild as any).ownerId,
                };
            })
        );
    });

    router.get('/api/guilds/:guild', async (req: Request, res: Response) => {
        const guildId = req.params['guild'] as string;
        if (!guildId) {
            res.sendStatus(400);
            return;
        }

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
            res.sendStatus(404);
            return;
        }

        res.status(200).json({
            id: guild.id,
            name: guild.name,
            iconURL: guild.iconURL({ forceStatic: true }),
            owner: guild.ownerId,

            premiumTier: guild.premiumTier,
            premiumSubscriptionCount: guild.premiumSubscriptionCount,

            createdAt: guild.createdTimestamp,
            joinedAt: guild.joinedTimestamp,

            channels: guild.channels.cache.size,
            members: guild.memberCount,
            roles: guild.roles.cache.size,
        });
    });

    router.get('/api/guilds/:guild/members', async (req: Request, res: Response) => {
        const guildId = req.params['guild'] as string;
        if (!guildId) {
            res.sendStatus(400);
            return;
        }

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
            res.sendStatus(404);
            return;
        }

        const members = await guild.members.fetch().catch(() => null);
        if (!members) {
            res.sendStatus(500);
            return;
        }

        res.status(200).json(
            members.map((member) => {
                return {
                    id: member.id,
                    username: member.user.username,
                    discriminator: member.user.discriminator,
                    displayAvatarURL: member.user.displayAvatarURL({ forceStatic: true }),

                    nickname: member.nickname,
                    guildDisplayAvatarURL: member.displayAvatarURL({ forceStatic: true }),

                    createdAt: member.user.createdTimestamp,
                    joinedAt: member.joinedTimestamp,
                };
            })
        );
    });

    router.get('/api/guilds/:guild/members/:member', async (req: Request, res: Response) => {
        const guildId = req.params['guild'] as string;
        const memberId = req.params['member'] as string;
        if (!guildId || !memberId) {
            res.sendStatus(400);
            return;
        }

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
            res.sendStatus(404);
            return;
        }

        const member = await guild.members.fetch(memberId).catch(() => null);
        if (!member) {
            res.sendStatus(404);
            return;
        }

        res.status(200).json({
            id: member.id,
            name: member.displayName,
            discriminator: member.user.discriminator,
            displayAvatarURL: member.user.displayAvatarURL({ forceStatic: true }),

            nickname: member.nickname,
            guildDisplayAvatarURL: member.displayAvatarURL({ forceStatic: true }),

            createdAt: member.user.createdTimestamp,
            joinedAt: member.joinedTimestamp,

            owner: guild.ownerId === member.id,
            administrator: member.permissions.has('Administrator'),
        });
    });

    router.get('/infractions/:id/inactive', infractionsLimiter, async (req: Request, res: Response) => {
        const id = req.params['id'] as string;
        if (!id) {
            res.sendStatus(400);
            return;
        }

        try {
            const infraction = await Infractions.findById(id);
            if (!infraction) {
                res.sendStatus(404);
                return;
            }

            if (infraction.type === 'ban') {
                const guild = await client.guilds.fetch(infraction.guild).catch(() => null);
                if (!guild) {
                    res.sendStatus(500);
                    return;
                }

                await guild.members.unban(infraction.user, 'Temporary ban expired');
                client.expiringDocumentsManager.infractions.removeDocument(infraction);
                res.sendStatus(200);
            } else if (infraction.type === 'timeout') {
                const guild = await client.guilds.fetch(infraction.guild).catch(() => null);
                if (!guild) {
                    res.sendStatus(500);
                    return;
                }

                const member = await guild.members.fetch(infraction.user).catch(() => null);
                if (!member) {
                    res.sendStatus(500);
                    return;
                }

                await member.timeout(null);
                client.expiringDocumentsManager.infractions.removeDocument(infraction);
                res.sendStatus(200);
            } else {
                res.sendStatus(400);
            }
        } catch {
            res.sendStatus(400);
        }
    });

    return router;
}
