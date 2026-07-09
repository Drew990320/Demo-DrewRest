"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteThrottle = WriteThrottle;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
function WriteThrottle() {
    return (0, common_1.applyDecorators)((0, throttler_1.Throttle)({
        default: {
            limit: 90,
            ttl: 60_000,
        },
    }));
}
//# sourceMappingURL=write-throttle.decorator.js.map