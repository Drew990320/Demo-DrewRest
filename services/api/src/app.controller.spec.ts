import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return ok', () => {
      expect(appController.health()).toEqual({
        ok: true,
        service: 'la-reserva-api',
      });
    });
  });

  describe('ready', () => {
    it('should return ok when db responds', async () => {
      await expect(appController.ready()).resolves.toEqual({
        ok: true,
        service: 'la-reserva-api',
        db: true,
      });
    });
  });
});
