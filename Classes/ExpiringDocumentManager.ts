import Mongoose from 'mongoose';

export default class ExpiringDocumentManager<T extends Mongoose.Document> {
    private model: Mongoose.Model<T>;
    private timeField: string;
    private expiredFunction: (document: T) => Promise<unknown>;
    private query: Mongoose.FilterQuery<T>;
    private documents: Array<T> = [];
    private checkTimeout: NodeJS.Timeout | null | Promise<NodeJS.Timeout | null> = null;

    /**
     * @param model
     * @param timeField which field of the document to use as expiration time
     * @param expiredFunction
     * @param query filter which documents are checked
     */
    constructor(
        model: Mongoose.Model<T>,
        timeField: string,
        expiredFunction: (document: T) => Promise<unknown>,
        query: Mongoose.FilterQuery<T> = {}
    ) {
        this.model = model;
        this.timeField = timeField;
        this.expiredFunction = expiredFunction;
        this.query = query;
    }

    async init() {
        // fetch all documents matching the given query, make sure they aren't permenant and sort by expiration
        this.documents = await this.model
            .find({ ...this.query, [this.timeField]: { $ne: Infinity } })
            .sort({ [this.timeField]: 1 });

        this.checkTimeout = this.checkForExpired() as any; // start the checking loop
        await this.checkTimeout; // this is done so that checkTimeout is a Promise, we should wait until we finished checking to add/remove/update a document
    }

    /**
     * @private
     */
    private async checkForExpired(): Promise<NodeJS.Timeout | null> {
        const executionTime = Date.now(); // make sure all comparisons are using the same time
        const expiredDocuments = this.documents.filter(
            (document) => executionTime >= (document.get(this.timeField) as number)
        );
        this.documents = this.documents.filter(
            (document) => executionTime < (document.get(this.timeField) as number)
        ); // filter out expired documents

        const updatedDocuments = (
            await Promise.all(expiredDocuments.map((document) => this.expiredFunction(document)))
        ) // execute the expired function on each document
            .filter(
                (document): document is T =>
                    document instanceof Mongoose.Document &&
                    (document.get(this.timeField) as number) > executionTime
            ); // grab any returned documents that have a new expiration date

        if (updatedDocuments.length > 0) {
            this.documents.push(...updatedDocuments); // add the updated documents back into the check
            this.documents.sort(
                (a, b) => (a.get(this.timeField) as number) - (b.get(this.timeField) as number)
            ); // resort with new documents
        }

        if (this.documents[0]) {
            const nextExpiration = this.documents[0].get(this.timeField) as number;
            if (Date.now() >= nextExpiration) return this.checkForExpired(); // some documents expired while we were checking, recheck

            const delay = Math.min(2147483647, nextExpiration - Date.now());
            return (this.checkTimeout = setTimeout(() => {
                this.checkTimeout = this.checkForExpired() as any; // time's up, check em
            }, delay)); // wait until the next document expires, or max safe 32bit integer in milliseconds (25~ days)
        }

        return (this.checkTimeout = null);
    }

    async addNewDocument(document: T) {
        if (!document) throw new Error('No document provided');
        this.checkTimeout = await this.checkTimeout; // incase were checking, wait for it to complete

        const nextExpiration = this.documents[0]?.get(this.timeField) as number | undefined;

        if (this.checkTimeout && nextExpiration !== undefined) {
            // if we have documents that need to be checked
            if ((document.get(this.timeField) as number) - nextExpiration < 0) {
                // if our document expires sooner than the one were waiting for
                clearTimeout(this.checkTimeout as NodeJS.Timeout);
                this.checkTimeout = null;

                this.documents.unshift(document);
                const delay = Math.min(
                    2147483647,
                    (this.documents[0].get(this.timeField) as number) - Date.now()
                );
                this.checkTimeout = setTimeout(() => {
                    this.checkTimeout = this.checkForExpired() as any; // time's up, check em
                }, delay); // wait until the next document expires
            } else {
                this.documents.push(document);
                this.documents.sort(
                    (a, b) => (a.get(this.timeField) as number) - (b.get(this.timeField) as number)
                );
            }
        } else {
            this.documents.push(document);
            const delay = Math.min(
                2147483647,
                (this.documents[0].get(this.timeField) as number) - Date.now()
            );
            this.checkTimeout = setTimeout(() => {
                this.checkTimeout = this.checkForExpired() as any; // time's up, check em
            }, delay); // wait until the next document expires
        }
    }

    async updateDocument(document: T) {
        if (!document) throw new Error('No document provided');
        if (this.documents.filter((doc) => doc.id === document.id).length === 0)
            return this.addNewDocument(document);

        this.checkTimeout = await this.checkTimeout; // incase were checking, wait for it to complete

        const firstDoc = this.documents[0];
        if (this.checkTimeout && firstDoc) {
            // if we have documents that need to be checked
            if (firstDoc.id === document.id) {
                // if the updated document is the one were waiting for, expiration time might be different
                clearTimeout(this.checkTimeout as NodeJS.Timeout);
                this.checkTimeout = null;

                this.documents = [
                    document,
                    ...this.documents.filter((doc) => doc.id !== document.id),
                ]; // replace the old document with the new one
                this.documents.sort(
                    (a, b) => (a.get(this.timeField) as number) - (b.get(this.timeField) as number)
                );
                const delay = Math.min(
                    2147483647,
                    (this.documents[0].get(this.timeField) as number) - Date.now()
                );
                this.checkTimeout = setTimeout(() => {
                    this.checkTimeout = this.checkForExpired() as any; // time's up, check em
                }, delay); // wait until the next document expires
            } else {
                this.documents = [
                    ...this.documents.filter((doc) => doc.id !== document.id),
                    document,
                ]; // replace the old document with the new one
                this.documents.sort(
                    (a, b) => (a.get(this.timeField) as number) - (b.get(this.timeField) as number)
                );
                const delay = Math.min(
                    2147483647,
                    (this.documents[0].get(this.timeField) as number) - Date.now()
                );
                this.checkTimeout = setTimeout(() => {
                    this.checkTimeout = this.checkForExpired() as any; // time's up, check em
                }, delay); // wait until the next document expires
            }
        } else {
            // we should never reach here(in theory), if were not waiting on any documents then the addNewDocument check earlier would've caught it
            this.documents.push(document);
            const delay = Math.min(
                2147483647,
                (this.documents[0]!.get(this.timeField) as number) - Date.now()
            );
            this.checkTimeout = setTimeout(() => {
                this.checkTimeout = this.checkForExpired() as any; // time's up, check em
            }, delay); // wait until the next document expires
        }
    }

    async removeDocument(document: T) {
        if (!document) throw new Error('No document provided');
        if (this.documents.filter((doc) => doc.id === document.id).length === 0) return;

        this.checkTimeout = await this.checkTimeout; // incase were checking, wait for it to complete
        const firstDoc = this.documents[0];
        if (this.checkTimeout && firstDoc?.id === document.id && this.documents[1]) {
            // if we have documents that need to be checked, were waiting on the document removed and we have more documents
            clearTimeout(this.checkTimeout as NodeJS.Timeout);
            this.checkTimeout = null;

            const delay = Math.min(
                2147483647,
                (this.documents[1].get(this.timeField) as number) - Date.now()
            );
            this.checkTimeout = setTimeout(() => {
                this.checkTimeout = this.checkForExpired() as any; // time's up, check em
            }, delay); // wait until the next document expires
        }

        this.documents = this.documents.filter((doc) => doc.id !== document.id);
    }
}
