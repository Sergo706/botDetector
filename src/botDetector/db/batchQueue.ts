import { updateBannedIP } from "./updateBanned.js";
import { updateIsBot } from "./updateIsBot.js";
import { updateVisitor } from "./updateVisitors.js";
import { updateScore } from "./updateVisitorScore.js";
import { getConfiguration } from "../config/config.js";
import { OpParams, BatchQueueOps, Priority, BatchJob } from "../types/batchQueue.js";
import { getLogger } from "@utils/logger.js";


export class BatchQueue {
    private jobs = new Map<string, BatchJob>();
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
        } else this.timer ??= setTimeout(() => void this.flush(), this.config.flushIntervalMs);
    }


    public async flush(): Promise<void> {
        while (this.flushPromise || this.jobs.size > 0) {
            if (this.flushPromise) {
                await this.flushPromise;
            }
            if (this.jobs.size > 0) {
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
                const currentBatch = Array.from(this.jobs.values());
                this.jobs.clear();
                this.flushPromise = this.executeBatch(currentBatch, 0);
                try {
                    await this.flushPromise;
                } finally {
                    this.flushPromise = null;
                }
            }
        }
    }

    private runJob(job: BatchJob): Promise<void> {
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
    }

    private async executeBatch(batch: BatchJob[], retryCount: number): Promise<void> {
        try {
            const visitors = batch.filter(j => j.type === 'visitor_upsert');
            const others = batch.filter(j => j.type !== 'visitor_upsert');
            if (visitors.length > 0) {
                await Promise.all(visitors.map(j => this.runJob(j)));
            }
            await Promise.all(others.map(j => this.runJob(j)));
        } catch (err) {
            this.log.error({err}, `Batch flush failed (Attempt ${String(retryCount + 1)})`);

            if (retryCount < this.config.maxRetries) {
                await new Promise(res => setTimeout(res, 1000));
                return this.executeBatch(batch, retryCount + 1);
            }
            this.log.error("Max retries reached. Discarding batch.");
        }
    }

    public async shutdown(): Promise<void> {
        this.log.info("Shutting down BatchQueue: Draining remaining jobs...");
        await this.flush();
    }
}