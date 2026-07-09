"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.precioEmpaqueParaLlevarDecimal = exports.productoCobraEmpaqueParaLlevarPorPlatoFuerte = exports.PRECIO_EMPAQUE_PARA_LLEVAR_COP = void 0;
const client_1 = require("@prisma/client");
const empaque_para_llevar_1 = require("@drewrest/shared-domain/empaque-para-llevar");
Object.defineProperty(exports, "PRECIO_EMPAQUE_PARA_LLEVAR_COP", { enumerable: true, get: function () { return empaque_para_llevar_1.PRECIO_EMPAQUE_PARA_LLEVAR_COP; } });
Object.defineProperty(exports, "productoCobraEmpaqueParaLlevarPorPlatoFuerte", { enumerable: true, get: function () { return empaque_para_llevar_1.productoCobraEmpaqueParaLlevarPorPlatoFuerte; } });
const precioEmpaqueParaLlevarDecimal = (monto) => new client_1.Prisma.Decimal(monto ?? empaque_para_llevar_1.PRECIO_EMPAQUE_PARA_LLEVAR_COP);
exports.precioEmpaqueParaLlevarDecimal = precioEmpaqueParaLlevarDecimal;
//# sourceMappingURL=empaque-para-llevar.js.map