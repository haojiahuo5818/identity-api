import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { IdentityCache } from './identity/identity.cache';
import { IdentityController } from './identity/identity.controller';
import { IdentityRepository } from './identity/identity.repository';
import { IdentityService } from './identity/identity.service';

@Module({
  controllers: [IdentityController],
  providers: [
    IdentityService,
    IdentityRepository,
    IdentityCache,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule {}
