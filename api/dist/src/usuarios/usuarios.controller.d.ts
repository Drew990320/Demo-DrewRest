import type { Usuario } from '@prisma/client';
import type { Request } from 'express';
import { CreateMeseroDto } from './dto/create-mesero.dto';
import { PatchUsuarioDto } from './dto/patch-usuario.dto';
import { UsuariosService } from './usuarios.service';
export declare class UsuariosController {
    private readonly usuarios;
    constructor(usuarios: UsuariosService);
    listar(): Promise<{
        id: number;
        nombre: string;
        apellido: string;
        email: string;
        rol: string;
        activo: boolean;
        creado_en: Date;
    }[]>;
    crearMesero(dto: CreateMeseroDto): Promise<{
        id: number;
        nombre: string;
        apellido: string;
        email: string;
        rol: string;
        activo: boolean;
        creado_en: Date;
    }>;
    actualizar(id: number, dto: PatchUsuarioDto, req: Request & {
        user: Usuario;
    }): Promise<{
        id: number;
        nombre: string;
        apellido: string;
        email: string;
        rol: string;
        activo: boolean;
        creado_en: Date;
    }>;
}
