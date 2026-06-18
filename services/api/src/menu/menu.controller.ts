import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MenuService } from './menu.service';

@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  /** Menú del día (zona horaria América/Bogotá). */
  @Get('today')
  today() {
    return this.menu.menuHoy();
  }
}
