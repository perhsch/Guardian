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
    private readonly maxQueueSize = 200;
    private readonly batchSize = 50;
    private readonly queueTimeout = 1000;
    private readonly maxConcurrent = 10;
    private activeRequests = 0;

    private generateKey(text: string, targetLang: string): string {
        return `${targetLang}:${text}`;
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0 || this.activeRequests >= this.maxConcurrent)
            return;
        this.processing = true;

        while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
            const batch = this.queue.splice(
                0,
                Math.min(this.batchSize, this.maxConcurrent - this.activeRequests)
            );
            this.activeRequests += batch.length;

            const promises = batch.map(async (item) => {
                try {
                    const key = this.generateKey(item.text, item.targetLang);
                    const cached = this.cache.get(key);
                    if (cached && Date.now() - cached.timestamp < this.ttl) {
                        return cached.text;
                    }

                    // Dynamic import with caching
                    const translate = (await import('@iamtraction/google-translate')).default;
                    const result = await translate(item.text, { from: 'en', to: item.targetLang });

                    this.setCache(item.text, item.targetLang, result.text);
                    return result.text;
                } catch (error) {
                    throw error;
                } finally {
                    this.activeRequests--;
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
        }

        if (this.queue.length > 0) {
            setImmediate(() => this.processQueue());
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
        // Fast path for empty or English content
        if (!text || !targetLang || targetLang.toLowerCase() === 'en' || text.trim().length === 0) {
            return Promise.resolve(text || '');
        }

        const key = this.generateKey(text, targetLang);
        const cached = this.cache.get(key);

        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return Promise.resolve(cached.text);
        }

        // Check for identical pending requests
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key)!;
        }

        const promise = new Promise<string>((resolve, reject) => {
            // Drop oldest items if queue is full
            if (this.queue.length >= this.maxQueueSize) {
                const dropped = this.queue.shift();
                if (dropped) {
                    dropped.reject(new Error('Queue overflow'));
                }
            }

            const queueItem: QueueItem = {
                text,
                targetLang,
                resolve,
                reject,
                timestamp: Date.now(),
            };

            this.queue.push(queueItem);

            // Reduced timeout for faster failure
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

        // Start processing immediately
        setImmediate(() => this.processQueue());

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
