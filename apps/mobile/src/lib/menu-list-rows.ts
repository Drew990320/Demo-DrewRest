export type MenuProductRow = {
  id_producto: number;
  nombre: string;
  precio: number;
  es_plato_principal?: boolean;
  es_empacable?: boolean;
  control_stock?: boolean;
  stock_disponible?: number;
  ocultar_sin_stock?: boolean;
  agotado?: boolean;
  opciones: { id_opcion: number; tipo: string; descripcion: string }[];
};

export type MenuListRow =
  | {
      kind: 'header';
      key: string;
      title: string;
      sectionIndex: number;
    }
  | {
      kind: 'product';
      key: string;
      product: MenuProductRow;
      sectionIndex: number;
      indexInSection: number;
      totalInSection: number;
    };

export function buildMenuListRows(
  sections: { title: string; data: MenuProductRow[] }[],
): MenuListRow[] {
  const rows: MenuListRow[] = [];
  sections.forEach((section, sectionIndex) => {
    rows.push({
      kind: 'header',
      key: `h-${sectionIndex}-${section.title}`,
      title: section.title,
      sectionIndex,
    });
    section.data.forEach((product, indexInSection) => {
      rows.push({
        kind: 'product',
        key: `p-${product.id_producto}`,
        product,
        sectionIndex,
        indexInSection,
        totalInSection: section.data.length,
      });
    });
  });
  return rows;
}

export function sectionStartIndices(rows: MenuListRow[]): number[] {
  const starts: number[] = [];
  rows.forEach((row, index) => {
    if (row.kind === 'header') {
      starts[row.sectionIndex] = index;
    }
  });
  return starts;
}
