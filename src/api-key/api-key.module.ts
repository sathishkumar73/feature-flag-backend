import { Module } from '@nestjs/common';
import { ApiKeyController } from './controllers/api-key.controller';
import { ApiKeyService } from './services/api-key.service';

@Module({
  providers: [ApiKeyService],
  controllers: [ApiKeyController],
})
export class ApiKeyModule {}
