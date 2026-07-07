import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/jwt.strategy';
import {
  getCachedAuthUser,
  setCachedAuthUser,
} from '../auth/auth-user-cache';
import { invalidateMenuHoyCache } from '../common/menu-hoy-cache';
import { PrismaService } from '../prisma/prisma.service';

type SocketUser = {
  idUsuario: number;
  rol: string;
};

export type ConfigScope = 'menu' | 'mesas' | 'categorias' | 'visual';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 256 * 1024,
  pingTimeout: 20_000,
  pingInterval: 25_000,
  connectTimeout: 10_000,
})
export class PedidosGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth?.token;
    if (typeof auth === 'string' && auth.trim()) {
      return auth.trim();
    }
    const query = client.handshake.query?.token;
    if (typeof query === 'string' && query.trim()) {
      return query.trim();
    }
    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }
    return null;
  }

  private async authenticate(client: Socket): Promise<SocketUser | null> {
    const token = this.extractToken(client);
    if (!token) return null;
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const idUsuario = Number(payload.sub);
      if (!Number.isFinite(idUsuario)) {
        return null;
      }
      const cached = getCachedAuthUser(idUsuario);
      if (cached?.activo) {
        const pwdAtEsperado = (
          cached.passwordCambiadoEn ?? cached.creadoEn
        ).getTime();
        if (payload.pwdAt == null || payload.pwdAt < pwdAtEsperado) {
          return null;
        }
        return { idUsuario: cached.idUsuario, rol: cached.rol.nombre };
      }
      const user = await this.prisma.usuario.findUnique({
        where: { idUsuario },
        include: { rol: true },
      });
      if (!user?.activo) {
        return null;
      }
      const pwdAtEsperado = (user.passwordCambiadoEn ?? user.creadoEn).getTime();
      if (payload.pwdAt == null || payload.pwdAt < pwdAtEsperado) {
        return null;
      }
      setCachedAuthUser(user);
      return { idUsuario: user.idUsuario, rol: user.rol.nombre };
    } catch {
      return null;
    }
  }

  private joinRoleRooms(client: Socket, user: SocketUser): void {
    void client.join(`rol:${user.rol}`);
    void client.join(`usuario:${user.idUsuario}`);
    if (user.rol === 'mesero' || user.rol === 'admin') {
      void client.join(`mesero:${user.idUsuario}`);
    }
  }

  async handleConnection(client: Socket) {
    const user = await this.authenticate(client);
    if (!user) {
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    this.joinRoleRooms(client, user);
  }

  @SubscribeMessage('join')
  async handleJoin(
    client: Socket,
    data: { mesaId?: number; cocina?: boolean; resumen?: boolean },
  ) {
    const user = client.data.user as SocketUser | undefined;
    if (!user) {
      return { ok: false, error: 'no_auth' };
    }
    if (data?.cocina && (user.rol === 'chef' || user.rol === 'admin')) {
      void client.join('cocina');
    }
    if (data?.resumen && user.rol === 'admin') {
      void client.join('resumen');
    }
    if (data?.mesaId != null) {
      const autorizado = await this.puedeUnirseMesa(user, data.mesaId);
      if (!autorizado) {
        return { ok: false, error: 'mesa_no_autorizada' };
      }
      void client.join(`mesa:${data.mesaId}`);
    }
    return { ok: true };
  }

  private async puedeUnirseMesa(
    user: SocketUser,
    mesaId: number,
  ): Promise<boolean> {
    if (user.rol === 'admin' || user.rol === 'chef') {
      return true;
    }
    if (user.rol !== 'mesero') {
      return false;
    }
    const activos = await this.prisma.pedido.count({
      where: {
        idMesa: mesaId,
        idUsuario: user.idUsuario,
        estado: { in: ['abierto', 'en_cocina'] },
      },
    });
    return activos > 0;
  }

  emitPedidoActualizado(
    pedidoId: number,
    mesaId: number,
    idUsuario: number,
  ) {
    const payload = {
      pedidoId,
      mesaId,
      at: new Date().toISOString(),
    };
    this.server.to(`mesa:${mesaId}`).emit('pedido:updated', payload);
    this.server.to('cocina').emit('pedido:updated', payload);
    this.server.to('resumen').emit('pedido:updated', payload);
    this.server.to(`mesero:${idUsuario}`).emit('pedido:updated', payload);
    this.server.to('rol:mesero').emit('mesas:updated', payload);
    this.server.to('rol:admin').emit('mesas:updated', payload);
  }

  emitConfigActualizada(scope: ConfigScope) {
    if (scope === 'menu') {
      invalidateMenuHoyCache();
    }
    const payload = { scope, at: new Date().toISOString() };
    for (const rol of ['admin', 'mesero', 'chef'] as const) {
      this.server.to(`rol:${rol}`).emit('config:actualizada', payload);
    }
  }

  emitAuthSesionInvalidada(
    idUsuario: number,
    motivo: 'desactivado' | 'credenciales',
    mensaje?: string,
  ) {
    const payload = {
      motivo,
      mensaje,
      at: new Date().toISOString(),
    };
    this.server.to(`usuario:${idUsuario}`).emit('auth:sesion-invalidada', payload);
  }

  emitCocinaLlamaMesero(payload: {
    pedidoId: number;
    mesaId: number;
    mesaNumero: number;
    idMesero: number;
    meseroNombre: string;
    platosListos: number;
    entradasListos?: number;
    tipo_listo?: 'entrada' | 'plato' | 'mixto';
    at: string;
  }) {
    this.server
      .to(`mesero:${payload.idMesero}`)
      .emit('cocina:llama-mesero', payload);
  }

  emitCocinaFaltaPlato(payload: {
    pedidoId: number;
    mesaId: number;
    mesaNumero: number;
    idDetalle: number;
    productoNombre: string;
    cantidad: number;
    meseroNombre: string;
    at: string;
  }) {
    this.server.to('cocina').emit('cocina:falta-plato', payload);
  }

  emitCompaneroAgregoItems(payload: {
    pedidoId: number;
    mesaId: number;
    mesaNumero: number;
    idMeseroDueno: number;
    idMeseroQuienAgrego: number;
    meseroQuienAgregoNombre: string;
    lineas: { nombre_producto: string; cantidad: number }[];
    accion?: 'agregado' | 'quitado' | 'reducido';
    at: string;
  }) {
    const destinos = [
      `mesero:${payload.idMeseroDueno}`,
      `usuario:${payload.idMeseroDueno}`,
    ];
    for (const room of destinos) {
      this.server.to(room).emit('mesero:companero-agrego', payload);
    }
  }

  emitImpresoraAlerta(payload: {
    codigo: 'sin_papel' | 'papel_bajo';
    mensaje: string;
    destino?: string;
    contexto?: 'comanda' | 'factura' | 'prueba' | 'cierre';
    pedidoId?: number;
    at: string;
  }) {
    for (const rol of ['admin', 'mesero', 'chef'] as const) {
      this.server.to(`rol:${rol}`).emit('impresora:alerta', payload);
    }
  }
}
