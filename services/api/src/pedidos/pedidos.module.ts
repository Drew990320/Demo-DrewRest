import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PedidosController } from './pedidos.controller';
import { PedidosGateway } from './pedidos.gateway';
import { PedidosService } from './pedidos.service';
import { ComandaPrinterService } from './comanda-printer.service';

@Module({
  imports: [AuthModule],
  controllers: [PedidosController],
  providers: [PedidosService, PedidosGateway, ComandaPrinterService],
  exports: [PedidosService],
})
export class PedidosModule {}
