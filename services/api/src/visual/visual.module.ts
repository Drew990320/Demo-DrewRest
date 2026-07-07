import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { ConfigVisualService } from './config-visual.service';
import { VisualController } from './visual.controller';

@Module({
  imports: [PedidosModule],
  controllers: [VisualController],
  providers: [ConfigVisualService],
  exports: [ConfigVisualService],
})
export class VisualModule {}
