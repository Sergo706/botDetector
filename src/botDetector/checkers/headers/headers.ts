import { Request } from "express";
import { HeadersBase } from "./headersBase.js";

export class HeaderAnalysis extends HeadersBase {
    private readonly req: Request;

    constructor(req: Request) {
        super();
        this.req = req;
    }

    public async scoreHeaders() {
        const missing = this.mustHaveHeadersChecker(this.req);
        const engines = await this.engineHeaders(this.req);
        const weird = this.weirdHeaders(this.req);
        return missing + engines + weird;
    }

}