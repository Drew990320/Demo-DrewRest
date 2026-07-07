import { Module } from '@nestjs/common';
import { ConfigRestauranteService } from './config-restaurante.service';
import { RestauranteController } from './restaurante.controller';

@Module({
  controllers: [RestauranteController],
  providers: [ConfigRestauranteService],
  exports: [ConfigRestauranteService],
})
export class RestauranteModule {}
