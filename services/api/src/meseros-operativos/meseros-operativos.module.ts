import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PermisosModule } from '../permisos/permisos.module';
import { PedidosModule } from '../pedidos/pedidos.module';
import { MeserosOperativosController } from './meseros-operativos.controller';
import { MeserosOperativosService } from './meseros-operativos.service';

@Module({
  imports: [AuthModule, PermisosModule, PedidosModule],
  controllers: [MeserosOperativosController],
  providers: [MeserosOperativosService],
})
export class MeserosOperativosModule {}
