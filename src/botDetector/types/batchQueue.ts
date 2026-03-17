import { BannedInfo } from "./checkersTypes.js";
import { userValidation } from "./fingerPrint.js";

interface VisitorUpsertParams {
    insert: userValidation;
}

interface ScoreUpdateParams {
    score: number;
    cookie: string;
}

interface IsBotUpdateParams {
    isBot: boolean;
    cookie: string;
}

interface BannedIpParams {
    cookie: string;
    ipAddress: string;
    country: string;
    user_agent: string;
    info: BannedInfo;
}

export type OpParams = {
    visitor_upsert: VisitorUpsertParams;
    score_update: ScoreUpdateParams;
    is_bot_update: IsBotUpdateParams;
    update_banned_ip: BannedIpParams;
};

export interface BatchJob {
    id: string;
    type: BatchQueueOps;
    priority: Priority;
    params: OpParams[BatchQueueOps];
}

export type BatchQueueOps = 'visitor_upsert' | 'score_update' | 'is_bot_update' | 'update_banned_ip';
export type Priority = 'immediate' | 'deferred'

