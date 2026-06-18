import {
  Body,
  Controller,
  Delete,
  Get,
  BadRequestException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import type { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WriteThrottle } from '../common/write-throttle.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { AddDetalleDto } from './dto/add-detalle.dto';
import { FacturarDto } from './dto/facturar.dto';
import { ImprimirPrecuentaDto } from './dto/imprimir-precuenta.dto';
import { UpsertCajaDiariaDto } from './dto/caja-diaria.dto';
import { UpsertConfigDescuentosDto } from './dto/upsert-config-descuentos.dto';
import { PatchClienteMuleroDto } from './dto/patch-cliente-mulero.dto';
import { PatchMazorcasPedidoDto } from './dto/patch-mazorcas-pedido.dto';
import { PatchEstadoDto } from './dto/patch-estado.dto';
import { TransferirPedidoDto } from './dto/transferir.dto';
import { PatchDetalleCocinaDto } from './dto/patch-detalle-cocina.dto';
import { PatchListoParaRecogerDto } from './dto/patch-listo-para-recoger.dto';
import { FaltaEnCocinaDto } from './dto/falta-en-cocina.dto';
import { PatchDetalleCantidadDto } from './dto/patch-detalle-cantidad.dto';
import { PatchPrioridadCocinaDto } from './dto/patch-prioridad-cocina.dto';

@WriteThrottle()
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @SkipThrottle()
  @Get('estado-impresora')
  @UseGuards(RolesGuard)
  @Roles('admin')
  estadoImpresora() {
    return this.pedidos.estadoImpresora();
  }

  @Post('prueba-impresora')
  @UseGuards(RolesGuard)
  @Roles('admin')
  pruebaImpresora() {
    return this.pedidos.pruebaImpresora();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  crear(
    @Body() dto: CreatePedidoDto,
    @Req() req: Request & { user: Usuario },
  ) {
    return this.pedidos.crear(dto, req.user.idUsuario);
  }

  @SkipThrottle()
  @Get('activos-por-mesa/:mesaId')
  activosPorMesa(@Param('mesaId', ParseIntPipe) mesaId: number) {
    return this.pedidos.pedidosActivosPorMesa(mesaId);
  }

  @SkipThrottle()
  @Get('por-mesa/:mesaId')
  porMesa(@Param('mesaId', ParseIntPipe) mesaId: number) {
    return this.pedidos.pedidoActivoPorMesa(mesaId);
  }

  @SkipThrottle()
  @Get('cocina')
  @UseGuards(RolesGuard)
  @Roles('admin', 'chef')
  listarCocina(
    @Req() req: Request & { user: Usuario & { rol: { nombre: string } } },
  ) {
    return this.pedidos.listarCocina(req.user);
  }

  @SkipThrottle()
  @Get('mis-activos/resumen')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  listarMisActivosResumen(
    @Req() req: Request & { user: Usuario & { rol: { nombre: string } } },
  ) {
    return this.pedidos.listarMisActivosResumen(req.user);
  }

  @SkipThrottle()
  @Get('mis-activos')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  listarMisActivos(
    @Req() req: Request & { user: Usuario & { rol: { nombre: string } } },
  ) {
    return this.pedidos.listarMisActivos(req.user);
  }

  @SkipThrottle()
  @Get('ayuda-companeros/resumen')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  listarAyudaCompanerosResumen(
    @Req() req: Request & { user: Usuario & { rol: { nombre: string } } },
  ) {
    return this.pedidos.listarAyudaCompanerosResumen(req.user);
  }

  @SkipThrottle()
  @Get('ayuda-companeros')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  listarAyudaCompaneros(
    @Req() req: Request & { user: Usuario & { rol: { nombre: string } } },
  ) {
    return this.pedidos.listarAyudaCompaneros(req.user);
  }

  @SkipThrottle()
  @Get()
  listar(
    @Query('estados') estados?: string,
    @Query('orden') orden?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    if (!estados?.trim()) {
      throw new BadRequestException(
        'El parámetro "estados" es obligatorio (ej. estados=abierto,en_cocina)',
      );
    }
    const o: 'asc' | 'desc' | 'prioridad_cocina' =
      orden === 'prioridad_cocina'
        ? 'prioridad_cocina'
        : orden === 'asc'
          ? 'asc'
          : 'desc';
    const limitRaw = Number(limitStr ?? '50');
    const offsetRaw = Number(offsetStr ?? '0');
    const limit = Math.min(
      200,
      Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 50),
    );
    const offset = Math.max(
      0,
      Number.isFinite(offsetRaw) ? Math.floor(offsetRaw) : 0,
    );
    return this.pedidos.listar(estados, o, { limit, offset });
  }

  @SkipThrottle()
  @Get('resumen-diario/facturas/:idFactura/lineas')
  @UseGuards(RolesGuard)
  @Roles('admin')
  resumenDiarioLineasFactura(
    @Param('idFactura', ParseIntPipe) idFactura: number,
  ) {
    return this.pedidos.resumenDiarioLineasFactura(idFactura);
  }

  @SkipThrottle()
  @Get('resumen-diario')
  @UseGuards(RolesGuard)
  @Roles('admin')
  resumenDiario(@Query('fecha') fecha?: string) {
    return this.pedidos.resumenDiario(fecha);
  }

  @Post('resumen-diario/imprimir-completo')
  @UseGuards(RolesGuard)
  @Roles('admin')
  imprimirResumenCompleto(@Query('fecha') fecha?: string) {
    return this.pedidos.imprimirResumenDiarioCompleto(fecha);
  }

  @Post('resumen-diario/imprimir-total')
  @UseGuards(RolesGuard)
  @Roles('admin')
  imprimirResumenTotal(@Query('fecha') fecha?: string) {
    return this.pedidos.imprimirResumenDiarioTotal(fecha);
  }

  @SkipThrottle()
  @Get('caja-diaria')
  @UseGuards(RolesGuard)
  @Roles('admin')
  cajaDiaria(@Query('fecha') fecha?: string) {
    return this.pedidos.getCajaDiaria(fecha);
  }

  @Put('caja-diaria')
  @UseGuards(RolesGuard)
  @Roles('admin')
  upsertCajaDiaria(
    @Body() dto: UpsertCajaDiariaDto,
  ) {
    return this.pedidos.upsertCajaDiaria(dto);
  }

  @SkipThrottle()
  @Get('config-descuentos')
  configDescuentos() {
    return this.pedidos.getConfigDescuentos();
  }

  @Put('config-descuentos')
  @UseGuards(RolesGuard)
  @Roles('admin')
  upsertConfigDescuentos(@Body() dto: UpsertConfigDescuentosDto) {
    return this.pedidos.upsertConfigDescuentos(dto);
  }

  @Patch(':id/cliente-mulero')
  setClienteMulero(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchClienteMuleroDto,
  ) {
    return this.pedidos.setClienteMulero(id, dto.cliente_mulero);
  }

  /** Comensales del pedido (sincroniza la línea de mazorca en cocina). */
  @Patch(':id/mazorcas')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  actualizarComensales(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchMazorcasPedidoDto,
  ) {
    return this.pedidos.actualizarComensalesPedido(id, dto);
  }

  /** Mesero confirma que recogió el plato en cocina. */
  @Patch('detalles/:idDetalle/cocina')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  marcarDetalleCocina(
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: PatchDetalleCocinaDto,
  ) {
    return this.pedidos.marcarDetalleRecogido(idDetalle, dto);
  }

  /** Mesero avisa a cocina que un plato no está en el pase. */
  @Post('detalles/:idDetalle/falta-en-cocina')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  avisarFaltaEnCocina(
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: FaltaEnCocinaDto,
    @Req() req: Request & { user: Usuario & { rol: { nombre: string } } },
  ) {
    return this.pedidos.avisarFaltaEnCocina(
      idDetalle,
      req.user.idUsuario,
      req.user.rol.nombre,
      dto.cantidad,
    );
  }

  /** Cocina avisa que el plato está listo para que el mesero lo recoja. */
  @Patch('detalles/:idDetalle/listo-para-recoger')
  @UseGuards(RolesGuard)
  @Roles('admin', 'chef')
  marcarListoParaRecoger(
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: PatchListoParaRecogerDto,
  ) {
    return this.pedidos.marcarListoParaRecoger(idDetalle, dto);
  }

  /** Cocina vuelve a llamar al mesero (platos listos sin recoger). */
  @Post(':id/llamar-mesero')
  @UseGuards(RolesGuard)
  @Roles('admin', 'chef')
  llamarMesero(@Param('id', ParseIntPipe) id: number) {
    return this.pedidos.llamarMesero(id);
  }

  @Patch('detalles/:idDetalle/cantidad')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  actualizarCantidadDetalle(
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: PatchDetalleCantidadDto,
    @Req() req: Request & { user: Usuario },
  ) {
    return this.pedidos.actualizarCantidadDetalle(
      idDetalle,
      dto,
      req.user.idUsuario,
    );
  }

  @Delete('detalles/:idDetalle')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  eliminarDetalle(
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Req() req: Request & { user: Usuario },
  ) {
    return this.pedidos.eliminarDetalle(idDetalle, req.user.idUsuario);
  }

  @SkipThrottle()
  @Get(':id/historial')
  historialPedido(@Param('id', ParseIntPipe) id: number) {
    return this.pedidos.historialPedido(id);
  }

  @SkipThrottle()
  @Get(':id')
  uno(@Param('id', ParseIntPipe) id: number) {
    return this.pedidos.obtenerPorId(id);
  }

  @Post(':id/detalles')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  agregarDetalle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddDetalleDto,
    @Req() req: Request & { user: Usuario },
  ) {
    return this.pedidos.agregarDetalle(id, dto, req.user.idUsuario);
  }

  /** Imprime comanda de cocina (solo platos, sin precios) y marca líneas enviadas. */
  @Post(':id/pasar-cocina')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  pasarCocina(@Param('id', ParseIntPipe) id: number) {
    return this.pedidos.pasarCocina(id);
  }

  @Post(':id/reimprimir-comanda')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero', 'chef')
  reimprimirComanda(@Param('id', ParseIntPipe) id: number) {
    return this.pedidos.reimprimirComanda(id);
  }

  @Post(':id/reimprimir-factura')
  reimprimirFactura(
    @Param('id', ParseIntPipe) id: number,
    @Query('id_factura') idFactura?: string,
  ) {
    const idF =
      idFactura != null && idFactura !== ''
        ? parseInt(idFactura, 10)
        : undefined;
    return this.pedidos.reimprimirFactura(
      id,
      idF != null && Number.isFinite(idF) ? idF : undefined,
    );
  }

  @Post(':id/reimprimir-pedido-total')
  @UseGuards(RolesGuard)
  @Roles('admin')
  reimprimirPedidoTotal(@Param('id', ParseIntPipe) id: number) {
    return this.pedidos.reimprimirPedidoTotal(id);
  }

  @Post(':id/imprimir-precuenta')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  imprimirPrecuenta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ImprimirPrecuentaDto,
  ) {
    return this.pedidos.imprimirPrecuenta(id, dto);
  }

  @Post(':id/facturar')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  facturar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FacturarDto,
    @Req() req: Request & { user: Usuario & { rol: { nombre: string } } },
  ) {
    return this.pedidos.facturar(id, dto, req.user);
  }

  /** Cancela el pedido (si no está facturado) y libera la mesa. */
  @Post(':id/cancelar')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.pedidos.cancelar(id);
  }

  /** Transfiere el pedido a otra mesa libre y libera la anterior. */
  @Post(':id/transferir')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mesero')
  transferir(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferirPedidoDto,
  ) {
    return this.pedidos.transferir(id, dto);
  }

  @Patch(':id/estado')
  estado(@Param('id', ParseIntPipe) id: number, @Body() dto: PatchEstadoDto) {
    return this.pedidos.cambiarEstado(id, dto.estado);
  }

  /** Override manual de prioridad en cocina (`auto` = quitar override). Solo admin. */
  @Patch(':id/prioridad-cocina')
  @UseGuards(RolesGuard)
  @Roles('admin')
  prioridadCocina(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchPrioridadCocinaDto,
  ) {
    return this.pedidos.setPrioridadCocina(id, dto.modo);
  }
}
