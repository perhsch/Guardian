const joinTracking = new Map();

function recordJoin(guildId, userId, timeWindowMs) {
    const key = `${guildId}:${userId}`;
    if (!joinTracking.has(key)) {
        joinTracking.set(key, []);
    }
    const timestamps = joinTracking.get(key);
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

function getJoinCount(guildId, timeWindowMs) {
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

function getRecentJoiners(guildId, timeWindowMs) {
    const cutoff = Date.now() - timeWindowMs;
    const userIds = [];
    
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

function cleanup(guildId, maxAgeMs = 3600000) {
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

module.exports = {
    recordJoin,
    getJoinCount,
    getRecentJoiners,
    cleanup,
};
