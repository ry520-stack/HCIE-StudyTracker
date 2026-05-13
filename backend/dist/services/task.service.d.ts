export interface CreateTaskInput {
    title: string;
    type?: 'SHORT_TERM' | 'LONG_TERM';
    description?: string;
    dueDate?: string;
    userId: string;
}
export interface UpdateTaskInput {
    title?: string;
    type?: 'SHORT_TERM' | 'LONG_TERM';
    description?: string;
    dueDate?: string | null;
    completed?: boolean;
}
export interface TaskResponse {
    id: string;
    title: string;
    type: string;
    description: string | null;
    completed: boolean;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}
export declare function createTask(input: CreateTaskInput): Promise<TaskResponse>;
export declare function listTasks(userId: string, filters?: {
    type?: string;
    completed?: boolean;
}): Promise<TaskResponse[]>;
export declare function getTaskById(id: string, userId: string): Promise<TaskResponse | null>;
export declare function updateTask(id: string, userId: string, input: UpdateTaskInput): Promise<TaskResponse | null>;
export declare function deleteTask(id: string, userId: string): Promise<boolean>;
export declare function toggleTask(id: string, userId: string): Promise<TaskResponse | null>;
export declare function getTaskStats(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    shortTerm: number;
    longTerm: number;
}>;
//# sourceMappingURL=task.service.d.ts.map