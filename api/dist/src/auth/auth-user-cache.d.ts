import type { Rol, Usuario } from '@prisma/client';
export type UsuarioConRol = Usuario & {
    rol: Rol;
};
export declare function getCachedAuthUser(idUsuario: number): UsuarioConRol | null;
export declare function setCachedAuthUser(user: UsuarioConRol): void;
export declare function invalidateAuthUser(idUsuario: number): void;
export declare function clearAuthUserCache(): void;
