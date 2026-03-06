const joinTracking = new Map<string, number[]>();

export function recordJoin(guildId: string, userId: string, timeWindowMs: number): number {
    const key = `${guildId}:${userId}`;
    if (!joinTracking.has(key)) {
        joinTracking.set(key, []);
    }
    const timestamps = joinTracking.get(key)!;
    const now = Date.now();
    timestamps.push(now);
    const cutoff = now - timeWindowMs;
    
    while (timestamps.length && timestamps[0] < cutoff) {
        timestamps.shift();
    }
    
    if (timestamps.length === 0) {
        joinTracking.delete(key);
    }
    
    return timestamps.length;
}

export function getJoinCount(guildId: string, timeWindowMs: number): number {
    const cutoff = Date.now() - timeWindowMs;
    let count = 0;
    
    for (const [key, timestamps] of joinTracking.entries()) {
        if (key.startsWith(`${guildId}:`)) {
            const validTimestamps = timestamps.filter(ts => ts >= cutoff);
            if (validTimestamps.length > 0) {
                count++;
            }
        }
    }
    
    return count;
}

export function getRecentJoiners(guildId: string, timeWindowMs: number): string[] {
    const cutoff = Date.now() - timeWindowMs;
    const userIds: string[] = [];
    
    for (const [key, timestamps] of joinTracking.entries()) {
        if (key.startsWith(`${guildId}:`)) {
            const validTimestamps = timestamps.filter(ts => ts >= cutoff);
            if (validTimestamps.length > 0) {
                const userId = key.split(':')[1];
                userIds.push(userId);
            }
        }
    }
    
    return userIds;
}

export function cleanup(guildId?: string, maxAgeMs: number = 3600000): void {
    const cutoff = Date.now() - maxAgeMs;
    
    if (guildId) {
        for (const [key, timestamps] of joinTracking.entries()) {
            if (key.startsWith(`${guildId}:`)) {
                const filtered = timestamps.filter(ts => ts >= cutoff);
                if (filtered.length === 0) {
                    joinTracking.delete(key);
                } else {
                    joinTracking.set(key, filtered);
                }
            }
        }
    } else {
        for (const [key, timestamps] of joinTracking.entries()) {
            const filtered = timestamps.filter(ts => ts >= cutoff);
            if (filtered.length === 0) {
                joinTracking.delete(key);
            } else {
                joinTracking.set(key, filtered);
            }
        }
    }
}

setInterval(() => cleanup(), 5 * 60 * 1000);
