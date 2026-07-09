import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
export declare class PrismaClientExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost): void;
}
