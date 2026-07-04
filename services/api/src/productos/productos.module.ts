import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PedidosModule } from '../pedidos/pedidos.module';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';
import { PersonalizacionesController } from './personalizaciones.controller';
import { PersonalizacionesService } from './personalizaciones.service';

@Module({
  imports: [AuthModule, PedidosModule],
  controllers: [ProductosController, PersonalizacionesController],
  providers: [ProductosService, PersonalizacionesService],
})
export class ProductosModule {}
