export interface QuoteResponse {
    id: string | null;
    content: string;
    author: string | null;
    isDefault: boolean;
}
export declare function getDailyQuote(): Promise<QuoteResponse>;
export declare function createQuote(content: string, author?: string): Promise<QuoteResponse>;
export declare function deleteQuote(id: string): Promise<boolean>;
export declare function listQuotes(): Promise<QuoteResponse[]>;
//# sourceMappingURL=quote.service.d.ts.map