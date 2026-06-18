import { SerialPort } from 'serialport';

export type EstadoPapel = {
  sinPapel: boolean;
  papelBajo: boolean;
};

/** Consulta sensores de papel ESC/POS vía puerto serie (DLE EOT 3 y 4). */
export function consultarPapelSerial(
  comPath: string,
  baudRate: number,
): Promise<EstadoPapel | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: EstadoPapel | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(value);
    };

    const port = new SerialPort(
      { path: comPath, baudRate, autoOpen: false },
      () => {},
    );

    const timeout = setTimeout(() => {
      port.close(() => finish(null));
    }, 2500);

    port.open((openErr) => {
      if (openErr) {
        finish(null);
        return;
      }

      const responses: Buffer[] = [];
      const onData = (chunk: Buffer) => {
        responses.push(chunk);
        if (responses.length >= 2) {
          port.removeListener('data', onData);
          const errByte = responses[0][0] ?? 0;
          const rollByte = responses[1][0] ?? 0;
          const sinPapelErr = (errByte & 0x20) !== 0;
          const sinPapelRoll = (rollByte & 0x20) === 0;
          const papelBajo = (rollByte & 0x04) !== 0;
          port.close(() =>
            finish({
              sinPapel: sinPapelErr || sinPapelRoll,
              papelBajo,
            }),
          );
        }
      };

      port.on('data', onData);
      // DLE EOT 3 = error status; DLE EOT 4 = paper roll sensor
      port.write(Buffer.from([0x10, 0x04, 0x03, 0x10, 0x04, 0x04]), (writeErr) => {
        if (writeErr) {
          port.removeListener('data', onData);
          port.close(() => finish(null));
        }
      });
    });
  });
}
