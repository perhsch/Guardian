import Mongoose from 'mongoose';

export interface IGuildMember extends Mongoose.Document {
    member: string;
    guilds: string[];
}

const GuildMemberSchema = new Mongoose.Schema({
    member: { type: String, required: true, index: true, immutable: true },
    guilds: { type: [String], required: true, index: true, default: [] },
});

export default Mongoose.model<IGuildMember>('Members', GuildMemberSchema);
