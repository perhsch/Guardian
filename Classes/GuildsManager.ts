import Guilds, { IGuild } from '../Schemas/Guilds.ts';

const cache = new Map<string, IGuild>();

class GuildsManagerVerification {
    private parent: GuildsManager;

    constructor(parent: GuildsManager) {
        this.parent = parent;
    }

    get enabled(): boolean {
        return this.parent.document!.verification.enabled;
    }

    set enabled(enabled: boolean) {
        this.parent.document!.verification.enabled = enabled;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'verification.enabled': enabled } }
        ).then(() => null);
    }

    get version(): null | 'button' | 'command' | 'captcha' {
        return this.parent.document!.verification.version;
    }

    set version(version: null | 'button' | 'command' | 'captcha') {
        this.parent.document!.verification.version = version;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'verification.version': version } }
        ).then(() => null);
    }

    get role(): string | null {
        return this.parent.document!.verification.role;
    }

    set role(role: string | null) {
        this.parent.document!.verification.role = role;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'verification.role': role } }).then(
            () => null
        );
    }

    get unverifiedRole(): string | null {
        return this.parent.document!.verification.unverifiedRole;
    }

    set unverifiedRole(roleId: string | null) {
        this.parent.document!.verification.unverifiedRole = roleId;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'verification.unverifiedRole': roleId } }
        ).then(() => null);
    }

    get channel(): string | null {
        return this.parent.document!.verification.channel;
    }

    set channel(channel: string | null) {
        this.parent.document!.verification.channel = channel;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'verification.channel': channel } }
        ).then(() => null);
    }
}

class GuildsManagerLogs {
    private parent: GuildsManager;

    constructor(parent: GuildsManager) {
        this.parent = parent;
    }

    get enabled(): boolean {
        return this.parent.document!.logs.enabled;
    }

    set enabled(enabled: boolean) {
        this.parent.document!.logs.enabled = enabled;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'logs.enabled': enabled } }).then(
            () => null
        );
    }

    get basic_logs(): string | null {
        return this.parent.document!.logs.basic_logs;
    }

    set basic_logs(basic_logs: string | null) {
        this.parent.document!.logs.basic_logs = basic_logs;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'logs.basic_logs': basic_logs } }
        ).then(() => null);
    }

    get moderator(): string | null {
        return this.parent.document!.logs.moderator;
    }

    set moderator(moderator: string | null) {
        this.parent.document!.logs.moderator = moderator;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'logs.moderator': moderator } }).then(
            () => null
        );
    }

    get suggestionsChannel(): string | null {
        return this.parent.document!.logs.suggestionsChannel ?? null;
    }

    set suggestionsChannel(channel: string | null) {
        this.parent.document!.logs.suggestionsChannel = channel;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'logs.suggestionsChannel': channel } }
        ).then(() => null);
    }

    get announcementChannel(): string | null {
        return this.parent.document!.logs.announcementChannel ?? null;
    }

    set announcementChannel(channel: string | null) {
        this.parent.document!.logs.announcementChannel = channel;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'logs.announcementChannel': channel } }
        ).then(() => null);
    }

    get giveawayChannel(): string | null {
        return this.parent.document!.logs.giveawayChannel ?? null;
    }

    set giveawayChannel(channel: string | null) {
        this.parent.document!.logs.giveawayChannel = channel;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'logs.giveawayChannel': channel } }
        ).then(() => null);
    }
}

class GuildsManagerAutoRole {
    private parent: GuildsManager;

    constructor(parent: GuildsManager) {
        this.parent = parent;
    }

    get enabled(): boolean {
        return this.parent.document!.autorole.enabled;
    }

    set enabled(enabled: boolean) {
        this.parent.document!.autorole.enabled = enabled;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'autorole.enabled': enabled } }).then(
            () => null
        );
    }

    get member(): string | null {
        return this.parent.document!.autorole.member;
    }

    set member(member: string | null) {
        this.parent.document!.autorole.member = member;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'autorole.member': member } }).then(
            () => null
        );
    }

    get bot(): string | null {
        return this.parent.document!.autorole.bot;
    }

    set bot(bot: string | null) {
        this.parent.document!.autorole.bot = bot;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'autorole.bot': bot } }).then(
            () => null
        );
    }
}

class GuildsManagerAntiRaid {
    public parent: GuildsManager;
    public lockdown: GuildsManagerAntiRaidLockdown;

    constructor(parent: GuildsManager) {
        this.parent = parent;
        this.lockdown = new GuildsManagerAntiRaidLockdown(this);
    }

    get enabled(): boolean {
        return this.parent.document!.antiraid.enabled;
    }

    set enabled(enabled: boolean) {
        this.parent.document!.antiraid.enabled = enabled;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'antiraid.enabled': enabled } }).then(
            () => null
        );
    }

    get raid(): boolean {
        return this.parent.document!.antiraid.raid;
    }

    set raid(raid: boolean) {
        this.parent.document!.antiraid.raid = raid;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'antiraid.raid': raid } }).then(
            () => null
        );
    }

    get joinAmount(): number | null {
        return this.parent.document!.antiraid.joinAmount;
    }

    set joinAmount(joinAmount: number | null) {
        this.parent.document!.antiraid.joinAmount = joinAmount;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'antiraid.joinAmount': joinAmount } }
        ).then(() => null);
    }

    get joinWithin(): number | null {
        return this.parent.document!.antiraid.joinWithin;
    }

    set joinWithin(joinWithin: number | null) {
        this.parent.document!.antiraid.joinWithin = joinWithin;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'antiraid.joinWithin': joinWithin } }
        ).then(() => null);
    }

    get action(): null | 'kick' | 'ban' {
        return this.parent.document!.antiraid.action;
    }

    set action(action: null | 'kick' | 'ban') {
        this.parent.document!.antiraid.action = action;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'antiraid.action': action } }).then(
            () => null
        );
    }

    get channel(): string | null {
        return this.parent.document!.antiraid.channel;
    }

    set channel(channel: string | null) {
        this.parent.document!.antiraid.channel = channel;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'antiraid.channel': channel } }).then(
            () => null
        );
    }
}

class GuildsManagerAntiRaidLockdown {
    private parent: GuildsManagerAntiRaid;

    constructor(parent: GuildsManagerAntiRaid) {
        this.parent = parent;
    }

    get enabled(): boolean {
        return this.parent.parent.document!.antiraid.lockdown.enabled;
    }

    set enabled(enabled: boolean) {
        this.parent.parent.document!.antiraid.lockdown.enabled = enabled;
        Guilds.updateOne(
            { guild: this.parent.parent.id },
            { $set: { 'antiraid.lockdown.enabled': enabled } }
        ).then(() => null);
    }

    get active(): boolean {
        return this.parent.parent.document!.antiraid.lockdown.active;
    }

    set active(active: boolean) {
        this.parent.parent.document!.antiraid.lockdown.active = active;
        Guilds.updateOne(
            { guild: this.parent.parent.id },
            { $set: { 'antiraid.lockdown.active': active } }
        ).then(() => null);
    }
}

class GuildsManagerSuggestion {
    private parent: GuildsManager;

    constructor(parent: GuildsManager) {
        this.parent = parent;
    }

    get enabled(): boolean {
        return this.parent.document!.suggestion.enabled;
    }

    set enabled(enabled: boolean) {
        this.parent.document!.suggestion.enabled = enabled;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'suggestion.enabled': enabled } }
        ).then(() => null);
    }

    get channel(): string | null {
        return this.parent.document!.suggestion.channel;
    }

    set channel(channel: string | null) {
        this.parent.document!.suggestion.channel = channel;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'suggestion.channel': channel } }
        ).then(() => null);
    }

    get reactions(): boolean {
        return this.parent.document!.suggestion.reactions;
    }

    set reactions(reactions: boolean) {
        this.parent.document!.suggestion.reactions = reactions;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'suggestion.reactions': reactions } }
        ).then(() => null);
    }
}

class GuildsManagerTickets {
    private parent: GuildsManager;

    constructor(parent: GuildsManager) {
        this.parent = parent;
    }

    get enabled(): boolean {
        return this.parent.document!.tickets.enabled;
    }

    set enabled(enabled: boolean) {
        this.parent.document!.tickets.enabled = enabled;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'tickets.enabled': enabled } }).then(
            () => null
        );
    }

    get category(): string | null {
        return this.parent.document!.tickets.category;
    }

    set category(category: string | null) {
        this.parent.document!.tickets.category = category;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'tickets.category': category } }
        ).then(() => null);
    }

    get channel(): string | null {
        return this.parent.document!.tickets.channel;
    }

    set channel(channel: string | null) {
        this.parent.document!.tickets.channel = channel;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'tickets.channel': channel } }).then(
            () => null
        );
    }

    get role(): string | null {
        return this.parent.document!.tickets.role;
    }

    set role(role: string | null) {
        this.parent.document!.tickets.role = role;
        Guilds.updateOne({ guild: this.parent.id }, { $set: { 'tickets.role': role } }).then(
            () => null
        );
    }

    get logChannel(): string | null {
        return this.parent.document!.tickets.logChannel;
    }

    set logChannel(channelId: string | null) {
        this.parent.document!.tickets.logChannel = channelId;
        Guilds.updateOne(
            { guild: this.parent.id },
            { $set: { 'tickets.logChannel': channelId } }
        ).then(() => null);
    }
}

export class GuildsManager {
    public id: string;
    public document: IGuild | null = null;
    public verification: GuildsManagerVerification;
    public logs: GuildsManagerLogs;
    public autorole: GuildsManagerAutoRole;
    public antiraid: GuildsManagerAntiRaid;
    public suggestion: GuildsManagerSuggestion;
    public tickets: GuildsManagerTickets;

    constructor(id: string) {
        this.id = id;
        this.verification = new GuildsManagerVerification(this);
        this.logs = new GuildsManagerLogs(this);
        this.autorole = new GuildsManagerAutoRole(this);
        this.antiraid = new GuildsManagerAntiRaid(this);
        this.suggestion = new GuildsManagerSuggestion(this);
        this.tickets = new GuildsManagerTickets(this);
    }

    get setup(): boolean {
        return this.document!.setup;
    }

    static async fetch(id: string): Promise<GuildsManager> {
        return await new GuildsManager(id)._fetch();
    }

    async _fetch(): Promise<GuildsManager> {
        this.document =
            cache.get(this.id) ||
            (await Guilds.findOne({ guild: this.id })) ||
            (await Guilds.create({ guild: this.id }));
        cache.set(this.id, this.document!);
        return this;
    }

    get members(): string[] {
        return this.document!.members;
    }

    set members(members: string[]) {
        this.document!.members = members;
        Guilds.updateOne({ guild: this.id }, { $set: { members: members } }).then(() => null);
    }
}
