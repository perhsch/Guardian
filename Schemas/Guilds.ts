import Mongoose from 'mongoose';

export interface IGuild extends Mongoose.Document {
    guild: string;
    setup: boolean;
    members: string[];
    verification: {
        enabled: boolean;
        version: null | 'button' | 'command' | 'captcha';
        role: string | null;
        unverifiedRole: string | null;
        channel: string | null;
    };
    logs: {
        enabled: boolean;
        basic_logs: string | null;
        moderator: string | null;
        global: string | null;
        suggestionsChannel: string | null;
        announcementChannel: string | null;
        giveawayChannel: string | null;
    };
    autorole: {
        enabled: boolean;
        member: string | null;
        bot: string | null;
    };
    antiraid: {
        enabled: boolean;
        raid: boolean;
        joinAmount: number | null;
        joinWithin: number | null;
        action: null | 'kick' | 'ban';
        lockdown: {
            enabled: boolean;
            active: boolean;
        };
        channel: string | null;
    };
    automod: {
        antiZalgo: {
            enabled: boolean;
            action: 'delete' | 'warn' | 'timeout';
        };
        antiBadwords: {
            enabled: boolean;
            words: string[];
            action: 'delete' | 'warn' | 'timeout';
        };
        antiNuke: {
            enabled: boolean;
            maxChannelsPerMinute: number;
            maxRolesPerMinute: number;
            action: 'kick' | 'ban';
        };
        antiAdvertisement: {
            enabled: boolean;
            action: 'delete' | 'warn' | 'timeout';
            whitelistChannels: string[];
        };
        antiCaps: {
            enabled: boolean;
            action: 'delete' | 'warn' | 'timeout';
            threshold: number;
            minLength: number;
        };
        antiMentionSpam: {
            enabled: boolean;
            action: 'delete' | 'warn' | 'timeout';
            maxMentions: number;
            checkEveryone: boolean;
        };
        antiSpam: {
            enabled: boolean;
            action: 'delete' | 'warn' | 'timeout';
            maxMessages: number;
            timeframe: number;
            maxDuplicates: number;
        };
    };
    suggestion: {
        enabled: boolean;
        channel: string | null;
        reactions: boolean;
    };
    tickets: {
        enabled: boolean;
        category: string | null;
        channel: string | null;
        role: string | null;
        logChannel: string | null;
    };
}

const GuildSchema = new Mongoose.Schema({
    guild: { type: String, required: true, index: true, immutable: true },
    setup: { type: Boolean, default: false },
    members: { type: [String], index: true, default: [] },
    verification: {
        enabled: { type: Boolean, default: false },
        version: { type: String, enum: [null, 'button', 'command', 'captcha'], default: null },
        role: { type: String, default: null },
        unverifiedRole: { type: String, default: null },
        channel: { type: String, default: null },
    },
    logs: {
        enabled: { type: Boolean, default: false },
        basic_logs: { type: String, default: null },
        moderator: { type: String, default: null },
        global: { type: String, default: null },
        suggestionsChannel: { type: String, default: null },
        announcementChannel: { type: String, default: null },
        giveawayChannel: { type: String, default: null },
    },
    autorole: {
        enabled: { type: Boolean, default: false },
        member: { type: String, default: null },
        bot: { type: String, default: null },
    },
    antiraid: {
        enabled: { type: Boolean, default: false },
        raid: { type: Boolean, default: false },
        joinAmount: { type: Number, default: null },
        joinWithin: { type: Number, default: null },
        action: { type: String, enum: [null, 'kick', 'ban'], default: null },
        lockdown: {
            enabled: { type: Boolean, default: false },
            active: { type: Boolean, default: false },
        },
        channel: { type: String, default: null },
    },
    automod: {
        antiZalgo: {
            enabled: { type: Boolean, default: false },
            action: { type: String, enum: ['delete', 'warn', 'timeout'], default: 'delete' },
        },
        antiBadwords: {
            enabled: { type: Boolean, default: false },
            words: { type: [String], default: [] },
            action: { type: String, enum: ['delete', 'warn', 'timeout'], default: 'delete' },
        },
        antiNuke: {
            enabled: { type: Boolean, default: false },
            maxChannelsPerMinute: { type: Number, default: 3 },
            maxRolesPerMinute: { type: Number, default: 3 },
            action: { type: String, enum: ['kick', 'ban'], default: 'ban' },
        },
        antiAdvertisement: {
            enabled: { type: Boolean, default: false },
            action: { type: String, enum: ['delete', 'warn', 'timeout'], default: 'delete' },
            whitelistChannels: { type: [String], default: [] },
        },
        antiCaps: {
            enabled: { type: Boolean, default: false },
            action: { type: String, enum: ['delete', 'warn', 'timeout'], default: 'delete' },
            threshold: { type: Number, default: 70 }, // percentage of caps
            minLength: { type: Number, default: 10 }, // minimum message length
        },
        antiMentionSpam: {
            enabled: { type: Boolean, default: false },
            action: { type: String, enum: ['delete', 'warn', 'timeout'], default: 'delete' },
            maxMentions: { type: Number, default: 5 }, // max mentions per message
            checkEveryone: { type: Boolean, default: true }, // check @everyone/@here
        },
        antiSpam: {
            enabled: { type: Boolean, default: false },
            action: { type: String, enum: ['delete', 'warn', 'timeout'], default: 'delete' },
            maxMessages: { type: Number, default: 5 }, // max messages in timeframe
            timeframe: { type: Number, default: 5000 }, // timeframe in milliseconds
            maxDuplicates: { type: Number, default: 3 }, // max duplicate messages
        },
    },
    suggestion: {
        enabled: { type: Boolean, default: false },
        channel: { type: String, default: null },
        reactions: { type: Boolean, default: false },
    },
    tickets: {
        enabled: { type: Boolean, default: false },
        category: { type: String, default: null },
        channel: { type: String, default: null },
        role: { type: String, default: null },
        logChannel: { type: String, default: null },
    },
});

const GuildsModel = Mongoose.model<IGuild>('Guilds', GuildSchema);
export default GuildsModel;
export { GuildsModel };
