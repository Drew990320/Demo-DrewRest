import { categoriaDisponibleEnDia } from './categoria-dia';

const cat = {
  disponibleLunes: true,
  disponibleMartes: false,
  disponibleMiercoles: true,
  disponibleJueves: false,
  disponibleViernes: true,
  disponibleSabado: false,
  disponibleDomingo: true,
};

describe('categoriaDisponibleEnDia', () => {
  it('mapea weekday 1-7 a flags de disponibilidad', () => {
    expect(categoriaDisponibleEnDia(cat, 1)).toBe(true);
    expect(categoriaDisponibleEnDia(cat, 2)).toBe(false);
    expect(categoriaDisponibleEnDia(cat, 7)).toBe(true);
  });

  it('devuelve false para weekday fuera de rango', () => {
    expect(categoriaDisponibleEnDia(cat, 0)).toBe(false);
    expect(categoriaDisponibleEnDia(cat, 8)).toBe(false);
  });
});
