import type { Usuario } from '@prisma/client';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
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
    me(req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): {
        id: number;
        nombre: string;
        apellido: string;
        email: string;
        rol: string;
    };
    verifyPassword(dto: VerifyPasswordDto, req: Request & {
        user: Usuario;
    }): Promise<{
        ok: boolean;
    }>;
}
