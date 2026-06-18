import { Redirect, useLocalSearchParams } from 'expo-router';

/** /pedido/:id sin subruta → menú del pedido (evita 404 al refrescar o enlazar mal). */
export default function PedidoIndexRedirect() {
  const { pedidoId, bebidas, paraLlevar } = useLocalSearchParams<{
    pedidoId: string;
    bebidas?: string;
    paraLlevar?: string;
  }>();
  const q: string[] = [];
  if (bebidas === '1' || bebidas === 'true') q.push('bebidas=1');
  if (paraLlevar === '1' || paraLlevar === 'true') q.push('paraLlevar=1');
  const suffix = q.length ? `?${q.join('&')}` : '';
  return (
    <Redirect href={`/(app)/pedido/${pedidoId}/menu${suffix}`} />
  );
}
