export function makeCookie(res, name, value, options) {
    if (name.startsWith("__Host-")) {
        options.secure = true;
        options.path = "/";
        delete options.domain;
    }
    if (name.startsWith("__Secure-")) {
        options.secure = true;
    }
    res.cookie(name, value, {
        httpOnly: options.httpOnly,
        sameSite: options.sameSite,
        maxAge: options.maxAge,
        secure: options.secure,
        expires: options.expires,
        domain: options.domain,
        path: options.path,
    });
}
