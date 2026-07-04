import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PermisosModule } from '../permisos/permisos.module';
import { PedidosController } from './pedidos.controller';
import { PedidosGateway } from './pedidos.gateway';
import { PedidosService } from './pedidos.service';
import { ComandaPrinterService } from './comanda-printer.service';
import { FacturaEmailService } from './factura-email.service';

@Module({
  imports: [AuthModule, PermisosModule],
  controllers: [PedidosController],
  providers: [
    PedidosService,
    PedidosGateway,
    ComandaPrinterService,
    FacturaEmailService,
  ],
  exports: [PedidosService, PedidosGateway],
})
export class PedidosModule {}
