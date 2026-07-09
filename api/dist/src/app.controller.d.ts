import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    root(): {
        ok: boolean;
        service: string;
        health: string;
        ready: string;
    };
    health(): {
        ok: boolean;
        service: string;
    };
    ready(): Promise<{
        ok: boolean;
        service: string;
        db: boolean;
    }>;
}
