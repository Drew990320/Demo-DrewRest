export function categoriaEsBebida(nombreCategoria: string): boolean {
  return nombreCategoria.toLowerCase().includes('bebida');
}

export function debeMarcarCocina(
  nombreCategoria: string,
  esEmpacable: boolean,
): boolean {
  return !categoriaEsBebida(nombreCategoria) && !esEmpacable;
}
