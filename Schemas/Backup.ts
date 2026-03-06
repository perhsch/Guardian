import Mongoose from 'mongoose';

export interface IBackup extends Mongoose.Document {
    guildId: string;
    backupId: string;
}

const BackupSchema = new Mongoose.Schema({
    guildId: {
        type: String,
        required: true,
    },
    backupId: {
        type: String,
        required: true,
    },
});

export default Mongoose.model<IBackup>('Backup', BackupSchema);
