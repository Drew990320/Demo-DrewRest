import type { SerialPort as SerialPortType } from 'serialport';

type SerialPortModule = typeof import('serialport');

let serialportModule: SerialPortModule | null = null;

/** Carga serialport solo al imprimir o consultar papel (no al arrancar Nest). */
export async function loadSerialPortClass(): Promise<typeof SerialPortType> {
  if (!serialportModule) {
    serialportModule = await import('serialport');
  }
  return serialportModule.SerialPort;
}
