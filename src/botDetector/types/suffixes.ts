export interface Value {
        suffix: string | string[],
        description: string,
        docs: string,
        useragent: string | string[];
}

export type Suffix = Record<string, Value>