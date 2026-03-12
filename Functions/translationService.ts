interface CacheEntry {
    text: string;
    timestamp: number;
}

interface QueueItem {
    text: string;
    targetLang: string;
    resolve: (value: string) => void;
    reject: (reason?: any) => void;
    timestamp: number;
}

class TranslationService {
    private cache = new Map<string, CacheEntry>();
    private pendingRequests = new Map<string, Promise<string>>();
    private queue: QueueItem[] = [];
    private processing = false;
    private readonly ttl = 1000 * 60 * 60 * 24;
    private readonly maxSize = 10000;
    private readonly maxQueueSize = 100;
    private readonly batchSize = 20;
    private readonly queueTimeout = 2000;

    private generateKey(text: string, targetLang: string): string {
        return `${targetLang}:${text}`;
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const batch = this.queue.splice(0, this.batchSize);
            const promises = batch.map(async (item) => {
                try {
                    const cached = this.cache.get(this.generateKey(item.text, item.targetLang));
                    if (cached && Date.now() - cached.timestamp < this.ttl) {
                        return cached.text;
                    }

                    const translate = (await import('@iamtraction/google-translate')).default;
                    const result = await translate(item.text, { from: 'en', to: item.targetLang });

                    this.setCache(item.text, item.targetLang, result.text);
                    return result.text;
                } catch (error) {
                    throw error;
                }
            });

            const results = await Promise.allSettled(promises);
            results.forEach((result, index) => {
                const item = batch[index];
                if (!item) return;

                if (result.status === 'fulfilled') {
                    item.resolve(result.value);
                } else {
                    item.reject(result.reason);
                }
            });

            if (this.queue.length > 0) {
                setImmediate(() => this.processQueue());
            }
        }

        this.processing = false;
    }

    private setCache(text: string, targetLang: string, translatedText: string): void {
        const key = this.generateKey(text, targetLang);

        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            text: translatedText,
            timestamp: Date.now(),
        });
    }

    translate(text: string, targetLang: string): Promise<string> {
        if (!text || !targetLang || targetLang.toLowerCase() === 'en') {
            return Promise.resolve(text);
        }

        const key = this.generateKey(text, targetLang);
        const cached = this.cache.get(key);

        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return Promise.resolve(cached.text);
        }

        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key)!;
        }

        const promise = new Promise<string>((resolve, reject) => {
            if (this.queue.length >= this.maxQueueSize) {
                this.queue.shift();
            }

            const queueItem: QueueItem = {
                text,
                targetLang,
                resolve,
                reject,
                timestamp: Date.now(),
            };

            this.queue.push(queueItem);

            setTimeout(() => {
                const index = this.queue.indexOf(queueItem);
                if (index > -1) {
                    this.queue.splice(index, 1);
                    reject(new Error('Translation timeout'));
                }
            }, this.queueTimeout);
        });

        this.pendingRequests.set(key, promise);

        promise.finally(() => {
            this.pendingRequests.delete(key);
        });

        this.processQueue();

        return promise;
    }

    clearCache(): void {
        this.cache.clear();
    }

    getCacheSize(): number {
        return this.cache.size;
    }

    getQueueSize(): number {
        return this.queue.length;
    }
}

export const translationService = new TranslationService();
