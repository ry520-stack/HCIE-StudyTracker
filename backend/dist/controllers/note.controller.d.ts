import { Request, Response } from 'express';
export declare function create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function list(req: Request, res: Response): Promise<void>;
export declare function getById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function remove(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function review(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getDue(req: Request, res: Response): Promise<void>;
export declare function getHealth(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=note.controller.d.ts.map