type MenuHoyPayload = {
    categorias: unknown[];
};
export declare function getCachedMenuHoy(): MenuHoyPayload | null;
export declare function setCachedMenuHoy(data: MenuHoyPayload): void;
export declare function invalidateMenuHoyCache(): void;
export {};
