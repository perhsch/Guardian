import Mongoose from 'mongoose';

export interface IReactionRole extends Mongoose.Document {
    guild: string;
    message: string;
    channel: string;
    title: string;
    roles: string[];
}

const ReactionRoleSchema = new Mongoose.Schema({
    guild: { type: String, required: true, index: true, immutable: true },
    message: { type: String, required: true, index: true, immutable: true },
    channel: { type: String, required: true },
    title: { type: String, required: true },
    roles: { type: [String], required: true },
});

export default Mongoose.model<IReactionRole>('ReactionRoles', ReactionRoleSchema);
