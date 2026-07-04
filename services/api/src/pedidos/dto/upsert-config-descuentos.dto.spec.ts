import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpsertConfigDescuentosDto } from './upsert-config-descuentos.dto';

describe('UpsertConfigDescuentosDto', () => {
  it('conserva reglas_promocion con todos sus campos', async () => {
    const dto = plainToInstance(UpsertConfigDescuentosDto, {
      reglas_promocion: [
        {
          id: 'promo-1',
          activa: true,
          etiqueta: 'Promo bebidas',
          tipo: 'por_categoria',
          id_categoria: 3,
          monto_por_unidad: 2222,
          min_unidades: 2,
          min_subtotal_otros: 33333,
        },
      ],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.reglas_promocion).toHaveLength(1);
    expect(dto.reglas_promocion?.[0]).toMatchObject({
      id: 'promo-1',
      etiqueta: 'Promo bebidas',
      tipo: 'por_categoria',
      id_categoria: 3,
      monto_por_unidad: 2222,
      min_unidades: 2,
      min_subtotal_otros: 33333,
    });
  });
});
