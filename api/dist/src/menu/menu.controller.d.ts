import { MenuService } from './menu.service';
export declare class MenuController {
    private readonly menu;
    constructor(menu: MenuService);
    today(): Promise<{
        categorias: unknown[];
    }>;
}
