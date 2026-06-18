import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/** Límite para mutaciones (POST/PATCH/PUT/DELETE) por IP. */
export function WriteThrottle() {
  return applyDecorators(
    Throttle({
      default: {
        limit: 90,
        ttl: 60_000,
      },
    }),
  );
}
