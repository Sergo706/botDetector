import { getConfiguration } from "../config/config.js";


export function getWhiteList(): string[] {
    const {whiteList} = getConfiguration()
    if (whiteList) return whiteList;
    return [];
}

export function isInWhiteList(ipAddress: string): boolean {
    const {whiteList} = getConfiguration()

    if (whiteList) {
        const match = whiteList.includes(ipAddress)
        return match;
    }

    return false;
}

