export type MisActivosResumen = {
  pedidos_mostrador: number;
  pedidos_para_llevar: number;
  platos_sin_pasar_cocina: number;
  platos_para_recoger: number;
  mazorcas_para_recoger?: number;
  mesa_ids: number[];
  pedido_ids: number[];
};
