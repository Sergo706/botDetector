export interface ApiError<E> {
    ok: false,
    date: Date | string,
    reason: E
}

export interface Success<T> {
    ok: true,
    date: Date | string,
    data: T
}


export type Results<T, E> = ApiError<E> | Success<T>