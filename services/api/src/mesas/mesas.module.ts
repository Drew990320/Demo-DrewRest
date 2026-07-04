import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PedidosModule } from '../pedidos/pedidos.module';
import { MesasController } from './mesas.controller';
import { MesasService } from './mesas.service';

@Module({
  imports: [AuthModule, PedidosModule],
  controllers: [MesasController],
  providers: [MesasService],
})
export class MesasModule {}
