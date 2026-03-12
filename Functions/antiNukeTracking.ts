type DeletionData = {
    channels: Map<string, number[]>;
    roles: Map<string, number[]>;
};

const deletionTracking = new Map<string, DeletionData>();

export function recordDeletion(
    guildId: string,
    userId: string,
    type: 'channel' | 'role',
    timeWindowMs: number = 60000
): number {
    if (!deletionTracking.has(guildId)) {
        deletionTracking.set(guildId, {
            channels: new Map(),
            roles: new Map(),
        });
    }
    const g = deletionTracking.get(guildId)!;
    const map = type === 'channel' ? g.channels : g.roles;
    if (!map.has(userId)) map.set(userId, []);
    const timestamps = map.get(userId)!;
    const now = Date.now();
    timestamps.push(now);
    const cutoff = now - timeWindowMs;

    while (timestamps.length && timestamps[0] < cutoff) {
        timestamps.shift();
    }

    if (timestamps.length === 0) {
        map.delete(userId);
    }

    if (g.channels.size === 0 && g.roles.size === 0) {
        deletionTracking.delete(guildId);
    }

    return timestamps.length;
}

export function cleanup(guildId?: string, maxAgeMs: number = 3600000): void {
    const cutoff = Date.now() - maxAgeMs;

    if (guildId) {
        const g = deletionTracking.get(guildId);
        if (!g) return;

        for (const [userId, timestamps] of g.channels.entries()) {
            const filtered = timestamps.filter((ts) => ts >= cutoff);
            if (filtered.length === 0) {
                g.channels.delete(userId);
            } else {
                g.channels.set(userId, filtered);
            }
        }

        for (const [userId, timestamps] of g.roles.entries()) {
            const filtered = timestamps.filter((ts) => ts >= cutoff);
            if (filtered.length === 0) {
                g.roles.delete(userId);
            } else {
                g.roles.set(userId, filtered);
            }
        }

        if (g.channels.size === 0 && g.roles.size === 0) {
            deletionTracking.delete(guildId);
        }
    } else {
        for (const [id, g] of deletionTracking.entries()) {
            for (const [userId, timestamps] of g.channels.entries()) {
                const filtered = timestamps.filter((ts) => ts >= cutoff);
                if (filtered.length === 0) {
                    g.channels.delete(userId);
                } else {
                    g.channels.set(userId, filtered);
                }
            }

            for (const [userId, timestamps] of g.roles.entries()) {
                const filtered = timestamps.filter((ts) => ts >= cutoff);
                if (filtered.length === 0) {
                    g.roles.delete(userId);
                } else {
                    g.roles.set(userId, filtered);
                }
            }

            if (g.channels.size === 0 && g.roles.size === 0) {
                deletionTracking.delete(id);
            }
        }
    }
}

setInterval(() => cleanup(), 5 * 60 * 1000);
