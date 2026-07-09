import { PrismaService } from '../prisma/prisma.service';
export declare class MenuService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    invalidateCache(): void;
    menuHoy(): Promise<{
        categorias: unknown[];
    }>;
}
