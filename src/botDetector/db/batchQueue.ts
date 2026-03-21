import { updateBannedIP } from "./updateBanned.js";
import { updateIsBot } from "./updateIsBot.js";
import { updateVisitor } from "./updateVisitors.js";
import { updateScore } from "./updateVisitorScore.js";
import { getConfiguration } from "../config/config.js";
import { OpParams, BatchQueueOps, Priority, BatchJob } from "../types/batchQueue.js";
import { getLogger } from "@utils/logger.js";


export class BatchQueue {
    private jobs: Map<string, BatchJob> = new Map();
    private timer: NodeJS.Timeout | null = null;
    private flushPromise: Promise<void> | null = null;

    private get config() {
        return getConfiguration().batchQueue;
    }

    private get log() {
        return getLogger().child({service: 'BOT DETECTOR', branch: 'BatchQueue'});
    }

    public async addQueue<T extends BatchQueueOps>(
        canary: string,
        ipAddress: string,
        type: T,
        params: OpParams[T],
        priority: Priority = 'deferred'
    ): Promise<void> {
        const key = `${type}:${canary}:${ipAddress}`;
        this.jobs.set(key, { id: key, type, priority, params });

        if (priority === 'immediate' || this.jobs.size >= this.config.maxBufferSize) {
            await this.flush();
        } else if (!this.timer) {
            this.timer = setTimeout(() => this.flush(), this.config.flushIntervalMs);
        }
    }


    public async flush(retryCount = 0): Promise<void> {
        if (this.flushPromise) {
            await this.flushPromise;
            if (this.jobs.size > 0) return this.flush(retryCount);
            return;
        }
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.jobs.size === 0) return;

        const currentBatch = Array.from(this.jobs.values());
        this.jobs.clear();

        this.flushPromise = this.executeBatch(currentBatch, retryCount);
        try {
            await this.flushPromise;
        } finally {
            this.flushPromise = null;
        }
    }

    private async executeBatch(batch: BatchJob[], retryCount: number): Promise<void> {
        try {
            await Promise.all(batch.map(job => {
                switch (job.type) {
                    case 'visitor_upsert':
                        return updateVisitor((job.params as OpParams['visitor_upsert']).insert);
                    case 'score_update': {
                        const {score, cookie} = job.params as OpParams['score_update'];
                        return updateScore(score, cookie);
                    }
                    case 'is_bot_update': {
                        const {isBot, cookie} = job.params as OpParams['is_bot_update'];
                        return updateIsBot(isBot, cookie);
                    }
                    case 'update_banned_ip': {
                        const {cookie, ipAddress, country, user_agent, info} = job.params as OpParams['update_banned_ip'];
                        return updateBannedIP(cookie, ipAddress, country, user_agent, info);
                    }
                }
            }));
        } catch (err) {
            this.log.error({err}, `Batch flush failed (Attempt ${retryCount + 1})`);

            if (retryCount < this.config.maxRetries) {
                await new Promise(res => setTimeout(res, 1000));
                batch.forEach(j => this.jobs.set(j.id, j));
                this.flushPromise = null;
                return this.flush(retryCount + 1);
            }
            this.log.error("Max retries reached. Discarding batch.");
        }
    }

    public async shutdown(): Promise<void> {
        this.log.info("Shutting down BatchQueue: Draining remaining jobs...");
        await this.flush();
    }
}