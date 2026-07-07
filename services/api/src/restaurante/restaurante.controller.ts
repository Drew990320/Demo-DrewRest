import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ConfigRestauranteService } from './config-restaurante.service';
import { UpsertConfigRestauranteDto } from './dto/upsert-config-restaurante.dto';

type LogoUploadFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
};

@Controller('restaurante')
export class RestauranteController {
  constructor(private readonly config: ConfigRestauranteService) {}

  /** Configuración completa del restaurante (solo admin). */
  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  obtenerConfig() {
    return this.config.obtener();
  }

  @Put('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  actualizarConfig(@Body() dto: UpsertConfigRestauranteDto) {
    return this.config.actualizar(dto);
  }

  /** Sube el logo del restaurante (PNG, JPEG o WebP; máx. 2 MB). */
  @Post('logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  async subirLogo(@UploadedFile() file: LogoUploadFile | undefined) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Adjunta una imagen (campo logo)');
    }
    return this.config.guardarLogo(
      file.buffer,
      file.mimetype,
      file.originalname,
    );
  }

  /** Subconjunto público para login (sin auth). */
  @SkipThrottle()
  @Get('config/publica')
  async configPublica() {
    const c = await this.config.obtener();
    return {
      nombre: c.nombre_comercial,
      telefono: c.telefono,
      direccion: c.direccion,
      tiene_logo: c.tiene_logo,
      logo_url: c.tiene_logo ? '/sistema/logo' : null,
    };
  }
}
