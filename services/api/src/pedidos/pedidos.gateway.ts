import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/jwt.strategy';

type SocketUser = {
  idUsuario: number;
  rol: string;
};

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class PedidosGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwt: JwtService) {}

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
      if (!Number.isFinite(idUsuario) || !payload.rol) {
        return null;
      }
      return { idUsuario, rol: payload.rol };
    } catch {
      return null;
    }
  }

  private joinRoleRooms(client: Socket, user: SocketUser): void {
    void client.join(`rol:${user.rol}`);
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
  handleJoin(
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
      void client.join(`mesa:${data.mesaId}`);
    }
    return { ok: true };
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

  emitCocinaLlamaMesero(payload: {
    pedidoId: number;
    mesaId: number;
    mesaNumero: number;
    idMesero: number;
    meseroNombre: string;
    platosListos: number;
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
    at: string;
  }) {
    this.server
      .to(`mesero:${payload.idMeseroDueno}`)
      .emit('mesero:companero-agrego', payload);
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
