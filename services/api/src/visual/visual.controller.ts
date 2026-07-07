import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { ConfigVisualService } from './config-visual.service';
import { UpsertConfigVisualDto } from './dto/upsert-config-visual.dto';
import {
  mimeFromAssetPath,
  type VisualAssetTipo,
} from './visual-assets.util';
import {
  assetEtagFromPath,
  readAssetFileCached,
} from './asset-file-cache';

type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
};

const ASSET_TIPOS = new Set<VisualAssetTipo>([
  'login',
  'factura',
  'ticket',
  'favicon',
  'navbar-fondo',
]);

function parseAssetTipo(raw: string): VisualAssetTipo {
  const t = raw as VisualAssetTipo;
  if (!ASSET_TIPOS.has(t)) {
    throw new BadRequestException('Tipo de asset no válido');
  }
  return t;
}

@Controller('visual')
export class VisualController {
  constructor(
    private readonly visual: ConfigVisualService,
    private readonly gateway: PedidosGateway,
  ) {}

  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  obtenerConfig() {
    return this.visual.obtener();
  }

  @Put('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async actualizarConfig(@Body() dto: UpsertConfigVisualDto) {
    const res = await this.visual.actualizar(dto);
    this.gateway.emitConfigActualizada('visual');
    return res;
  }

  @Post('config/restablecer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async restablecerConfig() {
    const res = await this.visual.restablecer();
    this.gateway.emitConfigActualizada('visual');
    this.gateway.emitConfigActualizada('categorias');
    return res;
  }

  @SkipThrottle()
  @Get('publica')
  async obtenerPublica(
    @Res({ passthrough: true }) res: Response,
    @Headers('if-none-match') ifNoneMatch?: string,
  ) {
    const data = await this.visual.obtenerPublica();
    const etag = `"${data.actualizado_en}"`;
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('ETag', etag);
    if (ifNoneMatch && ifNoneMatch === etag) {
      res.status(HttpStatus.NOT_MODIFIED);
      return;
    }
    return data;
  }

  @SkipThrottle()
  @Get('asset/:tipo')
  async asset(@Param('tipo') tipoRaw: string, @Res() res: Response) {
    await this.visual.obtenerRow();
    const tipo = parseAssetTipo(tipoRaw);
    const path = this.visual.resolveAssetPath(tipo);
    if (!path) {
      res.status(404).json({ message: 'Asset no configurado' });
      return;
    }
    res.setHeader('Content-Type', mimeFromAssetPath(path));
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');
    res.setHeader('ETag', assetEtagFromPath(path));
    res.send(readAssetFileCached(path));
  }

  @Post('asset/:tipo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  async subirAsset(
    @Param('tipo') tipoRaw: string,
    @UploadedFile() file: UploadFile | undefined,
  ) {
    const tipo = parseAssetTipo(tipoRaw);
    if (!file?.buffer?.length) {
      throw new BadRequestException('Adjunta una imagen (campo file)');
    }
    const saved = await this.visual.guardarAsset(
      tipo,
      file.buffer,
      file.mimetype,
      file.originalname,
    );
    this.gateway.emitConfigActualizada('visual');
    const pub = await this.visual.obtener();
    return {
      ...saved,
      config: pub,
    };
  }
}
