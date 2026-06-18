import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MesasController } from './mesas.controller';
import { MesasService } from './mesas.service';

@Module({
  imports: [AuthModule],
  controllers: [MesasController],
  providers: [MesasService],
})
export class MesasModule {}
