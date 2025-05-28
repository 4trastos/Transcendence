export class UserJwt {
    constructor(user, roles) {
        this.user = user;
        this.roles = roles;
    }
    toString() {
        return JSON.stringify(this, null, 2);
    }
}
//# sourceMappingURL=UserJwt.js.map