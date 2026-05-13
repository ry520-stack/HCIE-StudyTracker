export interface AuthPayload {
    userId: string;
    role: string;
}
export declare function signToken(payload: AuthPayload): string;
export declare function verifyToken(token: string): AuthPayload;
export declare function register(username: string, email: string, password: string): Promise<{
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
}>;
export declare function login(email: string, password: string): Promise<{
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
}>;
//# sourceMappingURL=auth.service.d.ts.map