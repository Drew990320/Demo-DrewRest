"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultarPapelSerial = consultarPapelSerial;
const serialport_loader_1 = require("./serialport-loader");
async function consultarPapelSerial(comPath, baudRate) {
    const SerialPort = await (0, serialport_loader_1.loadSerialPortClass)();
    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timeout);
            resolve(value);
        };
        const port = new SerialPort({ path: comPath, baudRate, autoOpen: false }, () => { });
        const timeout = setTimeout(() => {
            port.close(() => finish(null));
        }, 400);
        port.open((openErr) => {
            if (openErr) {
                finish(null);
                return;
            }
            const responses = [];
            const onData = (chunk) => {
                responses.push(chunk);
                if (responses.length >= 2) {
                    port.removeListener('data', onData);
                    const errByte = responses[0][0] ?? 0;
                    const rollByte = responses[1][0] ?? 0;
                    const sinPapelErr = (errByte & 0x20) !== 0;
                    const sinPapelRoll = (rollByte & 0x20) === 0;
                    const papelBajo = (rollByte & 0x04) !== 0;
                    port.close(() => finish({
                        sinPapel: sinPapelErr || sinPapelRoll,
                        papelBajo,
                    }));
                }
            };
            port.on('data', onData);
            port.write(Buffer.from([0x10, 0x04, 0x03, 0x10, 0x04, 0x04]), (writeErr) => {
                if (writeErr) {
                    port.removeListener('data', onData);
                    port.close(() => finish(null));
                }
            });
        });
    });
}
//# sourceMappingURL=escpos-paper-status.js.map