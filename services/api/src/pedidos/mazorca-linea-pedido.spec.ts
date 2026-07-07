import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { MESA_PARA_LLEVAR_NUMERO } from '../mesas/mesas.service';
import {
  crearLineaMazorcaInicial,
  esDetalleMazorcaAcompanamiento,
  idProductoMazorcaAcompanamiento,
  invalidateMazorcaProductIdCache,
  pedidoUsaLineaMazorca,
  sincronizarLineaMazorcaAcompanamiento,
} from './mazorca-linea-pedido';

const MAZORCA_ID = 42;
const ACOMP_ACTIVO = { usaLineaMazorca: true as const };

type LineaMock = {
  idDetalle: number;
  cantidad: number;
  enviadoCocina: boolean;
  listoParaRecoger: boolean;
  listoCocina: boolean;
};

function mockTx(
  lineas: LineaMock[] = [],
  opts?: { productoId?: number; existeInicial?: boolean },
) {
  const productoId = opts?.productoId ?? MAZORCA_ID;
  const detallePedido = {
    findMany: jest.fn().mockResolvedValue(lineas),
    findFirst: jest
      .fn()
      .mockResolvedValue(
        opts?.existeInicial ? { idDetalle: 1 } : null,
      ),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  };
  const producto = {
    findFirst: jest.fn().mockResolvedValue({ idProducto: productoId }),
  };
  return {
    tx: { producto, detallePedido } as unknown as Prisma.TransactionClient,
    detallePedido,
    producto,
  };
}

describe('mazorca-linea-pedido', () => {
  beforeEach(() => {
    invalidateMazorcaProductIdCache();
  });

  describe('pedidoUsaLineaMazorca', () => {
    it('usa línea de mazorca en mesas normales', () => {
      expect(pedidoUsaLineaMazorca(5, true)).toBe(true);
    });

    it('no usa línea si mazorca está desactivada en configuración', () => {
      expect(pedidoUsaLineaMazorca(5, false)).toBe(false);
    });

    it('no usa línea de mazorca en mesa para llevar (98)', () => {
      expect(pedidoUsaLineaMazorca(MESA_PARA_LLEVAR_NUMERO)).toBe(false);
    });

    it('no usa línea de mazorca en mostrador (99)', () => {
      expect(pedidoUsaLineaMazorca(99)).toBe(false);
    });
  });

  describe('esDetalleMazorcaAcompanamiento', () => {
    it('identifica producto marcado como acompañamiento', () => {
      expect(
        esDetalleMazorcaAcompanamiento({ esAcompanamientoMazorca: true }),
      ).toBe(true);
      expect(
        esDetalleMazorcaAcompanamiento({ esAcompanamientoMazorca: false }),
      ).toBe(false);
    });
  });

  describe('idProductoMazorcaAcompanamiento', () => {
    it('resuelve el id del producto marcado como acompañamiento', async () => {
      const { tx, producto } = mockTx();
      const id = await idProductoMazorcaAcompanamiento(tx);
      expect(id).toBe(MAZORCA_ID);
      expect(producto.findFirst).toHaveBeenCalledWith({
        where: { esAcompanamientoMazorca: true, activo: true },
        orderBy: { idProducto: 'asc' },
        select: { idProducto: true },
      });
    });

    it('lanza si el producto mazorca no está configurado', async () => {
      await jest.isolateModulesAsync(async () => {
        const mod = await import('./mazorca-linea-pedido');
        const { tx } = mockTx([], { productoId: 0 });
        (tx.producto.findFirst as jest.Mock).mockResolvedValue(null);
        await expect(
          mod.idProductoMazorcaAcompanamiento(tx),
        ).rejects.toThrow('acompañamiento por comensal');
      });
    });
  });

  describe('sincronizarLineaMazorcaAcompanamiento', () => {
    it('elimina líneas de mazorca en mesa para llevar', async () => {
      const { tx, detallePedido } = mockTx([{ idDetalle: 1, cantidad: 2, enviadoCocina: false, listoParaRecoger: false, listoCocina: false }]);
      await sincronizarLineaMazorcaAcompanamiento(tx, {
        idPedido: 10,
        numComensales: 3,
        mesaNumero: MESA_PARA_LLEVAR_NUMERO,
        estadoPedido: 'abierto',
      });
      expect(detallePedido.deleteMany).toHaveBeenCalledWith({
        where: {
          idPedido: 10,
          producto: { esAcompanamientoMazorca: true },
        },
      });
      expect(detallePedido.create).not.toHaveBeenCalled();
    });

    it('rechaza menos de 1 comensal', async () => {
      const { tx } = mockTx();
      await expect(
        sincronizarLineaMazorcaAcompanamiento(tx, {
          idPedido: 1,
          numComensales: 0,
          mesaNumero: 5,
          estadoPedido: 'abierto',
          ...ACOMP_ACTIVO,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza bajar comensales por debajo de mazorcas bloqueadas', async () => {
      const { tx } = mockTx([
        {
          idDetalle: 1,
          cantidad: 2,
          enviadoCocina: true,
          listoParaRecoger: false,
          listoCocina: true,
        },
      ]);
      await expect(
        sincronizarLineaMazorcaAcompanamiento(tx, {
          idPedido: 1,
          numComensales: 1,
          mesaNumero: 5,
          estadoPedido: 'en_cocina',
          ...ACOMP_ACTIVO,
        }),
      ).rejects.toThrow(
        'No puedes bajar comensales por debajo del acompañamiento ya listo o entregado',
      );
    });

    it('no hace nada si el total ya coincide con comensales', async () => {
      const { tx, detallePedido } = mockTx([
        {
          idDetalle: 1,
          cantidad: 3,
          enviadoCocina: false,
          listoParaRecoger: false,
          listoCocina: false,
        },
      ]);
      await sincronizarLineaMazorcaAcompanamiento(tx, {
        idPedido: 1,
        numComensales: 3,
        mesaNumero: 5,
        estadoPedido: 'abierto',
        ...ACOMP_ACTIVO,
      });
      expect(detallePedido.update).not.toHaveBeenCalled();
      expect(detallePedido.create).not.toHaveBeenCalled();
      expect(detallePedido.delete).not.toHaveBeenCalled();
    });

    it('incrementa cantidad en línea editable al subir comensales', async () => {
      const { tx, detallePedido } = mockTx([
        {
          idDetalle: 7,
          cantidad: 2,
          enviadoCocina: false,
          listoParaRecoger: false,
          listoCocina: false,
        },
      ]);
      await sincronizarLineaMazorcaAcompanamiento(tx, {
        idPedido: 1,
        numComensales: 5,
        mesaNumero: 5,
        estadoPedido: 'abierto',
        ...ACOMP_ACTIVO,
      });
      expect(detallePedido.update).toHaveBeenCalledWith({
        where: { idDetalle: 7 },
        data: { cantidad: 5 },
      });
      expect(detallePedido.create).not.toHaveBeenCalled();
    });

    it('crea línea nueva si no hay editable al subir comensales', async () => {
      const { tx, detallePedido } = mockTx([
        {
          idDetalle: 1,
          cantidad: 2,
          enviadoCocina: true,
          listoParaRecoger: false,
          listoCocina: true,
        },
      ]);
      await sincronizarLineaMazorcaAcompanamiento(tx, {
        idPedido: 1,
        numComensales: 4,
        mesaNumero: 5,
        estadoPedido: 'en_cocina',
        ...ACOMP_ACTIVO,
      });
      expect(detallePedido.create).toHaveBeenCalledWith({
        data: {
          idPedido: 1,
          idProducto: MAZORCA_ID,
          cantidad: 2,
          precioUnitario: 0,
          enviadoCocina: false,
        },
      });
    });

    it('crea línea pendiente al subir comensales sobre mazorca ya enviada a cocina', async () => {
      const { tx, detallePedido } = mockTx([
        {
          idDetalle: 7,
          cantidad: 2,
          enviadoCocina: true,
          listoParaRecoger: false,
          listoCocina: false,
        },
      ]);
      await sincronizarLineaMazorcaAcompanamiento(tx, {
        idPedido: 1,
        numComensales: 4,
        mesaNumero: 5,
        estadoPedido: 'en_cocina',
        ...ACOMP_ACTIVO,
      });
      expect(detallePedido.update).not.toHaveBeenCalled();
      expect(detallePedido.create).toHaveBeenCalledWith({
        data: {
          idPedido: 1,
          idProducto: MAZORCA_ID,
          cantidad: 2,
          precioUnitario: 0,
          enviadoCocina: false,
        },
      });
    });

    it('reduce cantidad en líneas editables al bajar comensales', async () => {
      const { tx, detallePedido } = mockTx([
        {
          idDetalle: 10,
          cantidad: 4,
          enviadoCocina: false,
          listoParaRecoger: false,
          listoCocina: false,
        },
      ]);
      await sincronizarLineaMazorcaAcompanamiento(tx, {
        idPedido: 1,
        numComensales: 2,
        mesaNumero: 5,
        estadoPedido: 'abierto',
        ...ACOMP_ACTIVO,
      });
      expect(detallePedido.update).toHaveBeenCalledWith({
        where: { idDetalle: 10 },
        data: { cantidad: 2 },
      });
    });

    it('elimina línea editable si la reducción agota su cantidad', async () => {
      const { tx, detallePedido } = mockTx([
        {
          idDetalle: 3,
          cantidad: 1,
          enviadoCocina: false,
          listoParaRecoger: false,
          listoCocina: false,
        },
        {
          idDetalle: 4,
          cantidad: 1,
          enviadoCocina: false,
          listoParaRecoger: false,
          listoCocina: false,
        },
      ]);
      await sincronizarLineaMazorcaAcompanamiento(tx, {
        idPedido: 1,
        numComensales: 1,
        mesaNumero: 5,
        estadoPedido: 'abierto',
        ...ACOMP_ACTIVO,
      });
      expect(detallePedido.delete).toHaveBeenCalledWith({
        where: { idDetalle: 4 },
      });
    });
  });

  describe('crearLineaMazorcaInicial', () => {
    it('no crea línea en mesa para llevar', async () => {
      const { tx, detallePedido } = mockTx();
      await crearLineaMazorcaInicial(tx, {
        idPedido: 1,
        numComensales: 4,
        mesaNumero: MESA_PARA_LLEVAR_NUMERO,
      });
      expect(detallePedido.create).not.toHaveBeenCalled();
    });

    it('crea línea inicial con cantidad = comensales', async () => {
      const { tx, detallePedido } = mockTx();
      await crearLineaMazorcaInicial(tx, {
        idPedido: 5,
        numComensales: 4,
        mesaNumero: 3,
        mazorcaActiva: true,
      });
      expect(detallePedido.create).toHaveBeenCalledWith({
        data: {
          idPedido: 5,
          idProducto: MAZORCA_ID,
          cantidad: 4,
          precioUnitario: 0,
          enviadoCocina: false,
        },
      });
    });

    it('no duplica si ya existe línea de mazorca', async () => {
      const { tx, detallePedido } = mockTx([], { existeInicial: true });
      await crearLineaMazorcaInicial(tx, {
        idPedido: 5,
        numComensales: 4,
        mesaNumero: 3,
        mazorcaActiva: true,
      });
      expect(detallePedido.create).not.toHaveBeenCalled();
    });
  });
});
