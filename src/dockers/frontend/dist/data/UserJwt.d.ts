export declare class UserJwt {
    user: string;
    roles?: string[];
    constructor(user: string, roles: string[]);
    toString(): string;
}
