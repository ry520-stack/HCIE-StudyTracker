export interface CreateNoteInput {
    title: string;
    content: string;
    tags?: string[];
    userId: string;
}
export interface UpdateNoteInput {
    title?: string;
    content?: string;
    tags?: string[];
}
export interface NoteResponse {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    nextReviewAt: Date | null;
    reviewCount: number;
    userId: string;
}
export declare function createNote(input: CreateNoteInput): Promise<NoteResponse>;
export declare function listNotes(userId: string, tag?: string): Promise<NoteResponse[]>;
export declare function getNoteById(id: string, userId: string): Promise<NoteResponse | null>;
export declare function updateNote(id: string, userId: string, input: UpdateNoteInput): Promise<NoteResponse | null>;
export declare function deleteNote(id: string, userId: string): Promise<boolean>;
export declare function reviewNote(id: string, userId: string): Promise<NoteResponse | null>;
export declare function getDueNotes(userId: string): Promise<NoteResponse[]>;
export declare function getNoteHealth(id: string, userId: string): Promise<{
    retentionRate: number;
    daysSinceLastReview: number;
} | null>;
//# sourceMappingURL=note.service.d.ts.map