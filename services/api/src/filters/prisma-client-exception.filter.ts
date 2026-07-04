import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Evita un 500 genérico cuando la BD no está alineada con el schema (p. ej. faltan columnas).
 * No expone mensajes internos de Prisma al cliente.
 */
@Catch(PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception.code === 'P2022') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'La base de datos no coincide con el esquema actual. En la carpeta services/api ejecuta: npx prisma db push (o npx prisma migrate deploy si usas migraciones) y reinicia el API.',
      });
      return;
    }

    this.logger.error(
      `Prisma ${exception.code}: ${exception.message}`,
      exception.stack,
    );

    // Códigos de concurrencia / fila no encontrada: respuesta estable sin filtrar SQL.
    if (exception.code === 'P2025') {
      res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Registro no encontrado',
      });
      return;
    }

    if (exception.code === 'P2002') {
      res.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'Ya existe un registro con esos datos',
      });
      return;
    }

    if (exception.code === 'P2034') {
      res.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'Conflicto de concurrencia; reintenta la operación',
      });
      return;
    }

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error de base de datos. Revisa los logs del servidor.',
    });
  }
}
