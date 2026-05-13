export interface CreateSessionInput {
    duration?: number;
    userId: string;
}
export interface UpdateSessionInput {
    elapsed?: number;
    switched?: number;
    status?: 'RUNNING' | 'COMPLETED' | 'FAILED';
}
export interface SessionResponse {
    id: string;
    startedAt: Date;
    duration: number;
    elapsed: number;
    switched: number;
    status: string;
    createdAt: Date;
    userId: string;
}
export declare function createSession(input: CreateSessionInput): Promise<SessionResponse>;
export declare function listSessions(userId: string, limit?: number, offset?: number): Promise<SessionResponse[]>;
export declare function getSessionById(id: string, userId: string): Promise<SessionResponse | null>;
export declare function updateSession(id: string, userId: string, input: UpdateSessionInput): Promise<SessionResponse | null>;
export declare function deleteSession(id: string, userId: string): Promise<boolean>;
export declare function getTodayStats(userId: string): Promise<{
    totalMinutes: number;
    completedCount: number;
    totalCount: number;
}>;
//# sourceMappingURL=focus.service.d.ts.map