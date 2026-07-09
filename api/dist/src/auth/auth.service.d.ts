import { JwtService } from '@nestjs/jwt';
import type { Usuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: number;
            nombre: string;
            apellido: string;
            email: string;
            rol: string;
        };
    }>;
    verifyPassword(user: Usuario, password: string): Promise<{
        ok: boolean;
    }>;
}
