import Users, { IUser } from '../Schemas/Users.ts';

const cache = new Map<string, IUser>();

export class UsersManager {
    public id: string;
    public guild: string;
    public document: IUser | null = null;

    constructor(id: string, guild: string) {
        this.id = id;
        this.guild = guild;
    }

    static async fetch(id: string, guild: string): Promise<UsersManager> {
        return await new UsersManager(id, guild)._fetch();
    }

    async _fetch(): Promise<UsersManager> {
        this.document =
            cache.get(`${this.id}-${this.guild}`) ||
            (await Users.findOne({ user: this.id, guild: this.guild })) ||
            (await Users.create({ user: this.id, guild: this.guild }));
        cache.set(`${this.id}-${this.guild}`, this.document!);
        return this;
    }

    get captcha(): string | null {
        return this.document!.captcha;
    }

    set captcha(captcha: string | null) {
        this.document!.captcha = captcha;
        Users.updateOne({ user: this.id, guild: this.guild }, { $set: { captcha: captcha } }).then(
            () => null
        );
    }

    get language(): string {
        return this.document!.language || 'en';
    }

    set language(language: string) {
        this.document!.language = language;
        Users.updateOne(
            { user: this.id, guild: this.guild },
            { $set: { language: language } }
        ).then(() => null);
    }
}
