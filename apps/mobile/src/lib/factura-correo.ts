import { api } from './api';
import { showBriefNotice, showNotice } from './app-dialog';
import { mensajeErrorUsuario } from './api-error';

export type ResultadoEnvioFacturaCorreo = {
  ok: boolean;
  email?: string;
  mensaje?: string;
};

/**
 * Envía el recibo/factura por correo vía el API (SMTP en el PC del restaurante).
 * Éxito: aviso en la campana. Fallo: diálogo para que no pase desapercibido.
 */
export async function enviarFacturaPorCorreo(opts: {
  token: string | null | undefined;
  idPedido: number;
  idFactura?: number | null;
  email: string;
  online: boolean;
}): Promise<ResultadoEnvioFacturaCorreo> {
  const email = opts.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    await showNotice(
      'Correo no enviado',
      'Indica un correo válido del cliente.',
      'warning',
    );
    return { ok: false };
  }

  if (!opts.online) {
    await showNotice(
      'Correo no enviado',
      'No hay conexión a internet. El cobro quedó guardado; intenta enviar el recibo cuando haya señal.',
      'warning',
    );
    return { ok: false };
  }

  try {
    const res = await api<{
      ok?: boolean;
      email?: string;
      mensaje?: string;
    }>(`/pedidos/${opts.idPedido}/enviar-factura-correo`, {
      method: 'POST',
      token: opts.token,
      body: JSON.stringify({
        email,
        ...(opts.idFactura != null ? { id_factura: opts.idFactura } : {}),
      }),
    });
    const destino = res.email ?? email;
    await showBriefNotice(
      'Factura enviada',
      res.mensaje ?? `Recibo enviado a ${destino}.`,
      'success',
    );
    return { ok: true, email: destino, mensaje: res.mensaje };
  } catch (e) {
    await showNotice(
      'Correo no enviado',
      mensajeErrorUsuario(
        e,
        'No se pudo enviar el recibo. Revisa internet y la configuración SMTP del servidor.',
      ),
      'error',
    );
    return { ok: false };
  }
}
