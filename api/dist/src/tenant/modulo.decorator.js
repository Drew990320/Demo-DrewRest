"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireModulo = exports.MODULOS_RESTAURANTE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.MODULOS_RESTAURANTE_KEY = 'modulos_restaurante';
const RequireModulo = (...modulos) => (0, common_1.SetMetadata)(exports.MODULOS_RESTAURANTE_KEY, modulos);
exports.RequireModulo = RequireModulo;
//# sourceMappingURL=modulo.decorator.js.map