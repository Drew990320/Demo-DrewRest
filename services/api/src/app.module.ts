import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CategoriasModule } from './categorias/categorias.module';
import { MenuModule } from './menu/menu.module';
import { CreditosModule } from './creditos/creditos.module';
import { MesasModule } from './mesas/mesas.module';
import { MeserosOperativosModule } from './meseros-operativos/meseros-operativos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PermisosModule } from './permisos/permisos.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductosModule } from './productos/productos.module';
import { RestauranteModule } from './restaurante/restaurante.module';
import { VisualModule } from './visual/visual.module';
import { SistemaController } from './sistema/sistema.controller';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // dist/src → api/.env en producción; src → api/.env en desarrollo.
      envFilePath: [
        join(__dirname, '..', '.env'),
        join(__dirname, '..', '..', '.env'),
        join(process.cwd(), '.env'),
      ],
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 300 }],
    }),
    PrismaModule,
    AuthModule,
    MesasModule,
    MenuModule,
    PedidosModule,
    ProductosModule,
    CategoriasModule,
    UsuariosModule,
    MeserosOperativosModule,
    PermisosModule,
    RestauranteModule,
    VisualModule,
    CreditosModule,
  ],
  controllers: [AppController, SistemaController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
