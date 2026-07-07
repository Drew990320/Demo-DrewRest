import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAccessService } from '../usuarios/admin-access.service';

@Module({
  imports: [PrismaModule],
  providers: [AdminAccessService],
  exports: [AdminAccessService],
})
export class AdminAccessModule {}
