export declare function validateGoodBots(browserType: string, browserName: string, ipAddress: string): Promise<{
    score: number;
    isBadBot: boolean;
    isGoodBot: boolean;
}>;
